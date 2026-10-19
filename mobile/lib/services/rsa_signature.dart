import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';

/// Verifies the update package signature produced by the backend
/// (`crypto.createSign('SHA256').sign(privateKey, 'base64')` with a 2048-bit
/// RSA key, i.e. RSASSA-PKCS1-v1_5 over SHA-256), against the SPKI PEM public
/// key served by `GET /saas/updates/public-key`.
///
/// Pure Dart (BigInt modPow) so no extra crypto dependency is needed —
/// verification only uses the public key, so there are no timing-secret
/// concerns here.
class RsaSignature {
  RsaSignature._();

  // DER prefix of DigestInfo{ sha256, NULL } (RFC 8017 §9.2 note 1).
  static const List<int> _sha256DigestInfoPrefix = [
    0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, //
    0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x04, 0x20,
  ];

  // OID 1.2.840.113549.1.1.1 (rsaEncryption).
  static const List<int> _rsaEncryptionOid = [
    0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
  ];

  /// True only if [signatureBase64] is a valid RSA PKCS#1 v1.5 SHA-256
  /// signature of [data] for [publicKeyPem]. Any malformed input → false.
  static bool verifySha256(
    List<int> data,
    String signatureBase64,
    String publicKeyPem,
  ) {
    try {
      final key = _parseSpkiPem(publicKeyPem);
      final sig = base64.decode(signatureBase64.trim());
      final k = (key.n.bitLength + 7) ~/ 8;
      if (sig.length != k) return false;

      final s = _toBigInt(sig);
      if (s >= key.n) return false;
      final m = s.modPow(key.e, key.n);
      final em = _toBytes(m, k);

      final digest = sha256.convert(data).bytes;
      final t = [..._sha256DigestInfoPrefix, ...digest];
      if (k < t.length + 11) return false;
      final expected = Uint8List(k);
      expected[0] = 0x00;
      expected[1] = 0x01;
      final psEnd = k - t.length - 1;
      for (int i = 2; i < psEnd; i++) {
        expected[i] = 0xff;
      }
      expected[psEnd] = 0x00;
      expected.setRange(psEnd + 1, k, t);

      int diff = 0;
      for (int i = 0; i < k; i++) {
        diff |= em[i] ^ expected[i];
      }
      return diff == 0;
    } catch (_) {
      return false;
    }
  }

  static _RsaPublicKey _parseSpkiPem(String pem) {
    final body = pem
        .replaceAll(RegExp(r'-----BEGIN [A-Z ]+-----'), '')
        .replaceAll(RegExp(r'-----END [A-Z ]+-----'), '')
        .replaceAll(RegExp(r'\s'), '');
    final der = base64.decode(body);
    final reader = _DerReader(der);

    // SubjectPublicKeyInfo ::= SEQUENCE { algorithm, subjectPublicKey }
    final spki = _DerReader(reader.read(0x30));
    final algorithm = _DerReader(spki.read(0x30));
    final oid = algorithm.read(0x06);
    if (!_listEquals(oid, _rsaEncryptionOid)) {
      throw const FormatException('Not an RSA public key');
    }
    final bitString = spki.read(0x03);
    if (bitString.isEmpty || bitString[0] != 0) {
      throw const FormatException('Unexpected BIT STRING padding');
    }
    // RSAPublicKey ::= SEQUENCE { modulus INTEGER, publicExponent INTEGER }
    final rsaKey = _DerReader(
      _DerReader(Uint8List.sublistView(bitString, 1)).read(0x30),
    );
    final n = _toBigInt(rsaKey.read(0x02));
    final e = _toBigInt(rsaKey.read(0x02));
    if (n <= BigInt.zero || e <= BigInt.zero) {
      throw const FormatException('Invalid RSA key');
    }
    return _RsaPublicKey(n, e);
  }

  static BigInt _toBigInt(List<int> bytes) {
    BigInt result = BigInt.zero;
    for (final b in bytes) {
      result = (result << 8) | BigInt.from(b);
    }
    return result;
  }

  static Uint8List _toBytes(BigInt value, int length) {
    final out = Uint8List(length);
    var v = value;
    final mask = BigInt.from(0xff);
    for (int i = length - 1; i >= 0; i--) {
      out[i] = (v & mask).toInt();
      v = v >> 8;
    }
    if (v != BigInt.zero) throw const FormatException('Value too large');
    return out;
  }

  static bool _listEquals(List<int> a, List<int> b) {
    if (a.length != b.length) return false;
    for (int i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
}

class _RsaPublicKey {
  final BigInt n;
  final BigInt e;
  _RsaPublicKey(this.n, this.e);
}

/// Minimal DER TLV reader (definite lengths only — all DER is).
class _DerReader {
  final Uint8List _bytes;
  int _pos = 0;
  _DerReader(List<int> bytes)
    : _bytes = bytes is Uint8List ? bytes : Uint8List.fromList(bytes);

  Uint8List read(int expectedTag) {
    if (_pos >= _bytes.length) throw const FormatException('DER: EOF');
    final tag = _bytes[_pos++];
    if (tag != expectedTag) {
      throw FormatException('DER: expected tag $expectedTag, got $tag');
    }
    int len = _bytes[_pos++];
    if (len & 0x80 != 0) {
      final count = len & 0x7f;
      if (count == 0 || count > 4) {
        throw const FormatException('DER: bad length');
      }
      len = 0;
      for (int i = 0; i < count; i++) {
        len = (len << 8) | _bytes[_pos++];
      }
    }
    if (_pos + len > _bytes.length) {
      throw const FormatException('DER: truncated');
    }
    final value = Uint8List.sublistView(_bytes, _pos, _pos + len);
    _pos += len;
    return value;
  }
}
