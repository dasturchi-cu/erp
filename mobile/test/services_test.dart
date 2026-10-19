import 'dart:convert';
import 'package:erp_mobile/services/api_service.dart';
import 'package:erp_mobile/services/rsa_signature.dart';
import 'package:flutter_test/flutter_test.dart';

// Test vector made with Node's crypto exactly like the backend's signBuffer()
// (createSign('SHA256').sign(privateKey, 'base64'), 2048-bit RSA, SPKI PEM).
// The key pair is throwaway and exists only for this test.
const _publicKeyPem =
    '-----BEGIN PUBLIC KEY-----\n'
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoNvQO6GRwWZpEUgVB3gu\n'
    'rszXfuqmeepz6FpFxd53ows+4tv+PHNTAARyvy1WPBT11XA8UszUDEgSYUBv8NMn\n'
    'mZRC4pAWQrqy8FvKHoxsSCuAefRP/VBIPmDHDh6IyTRqgjZbYao9fryAOjwJ1IN0\n'
    'b+cZFnOr/yn15ILkP791heJ1QrrETHchJ43GEmTzXsq/4JAqk7XyNd1cAUF03wa4\n'
    'Kio6XWCE+2po4uAIiWYPZSdPe/KPdgUeCSdu/wb/aqIp9R1B0T0TQpthwQlBviYu\n'
    '7xByimUmWd/giCh0XgVY9MELfIRbB4tO4bUpiRS1mrXrA4ogy5rqJsaiB3GX8pWS\n'
    'QwIDAQAB\n'
    '-----END PUBLIC KEY-----\n';

const _signature =
    'KAab3yii78ejBldm0fSGx9S/s1T0+tNMZBME/iW0+O1vxvUpFURCLOuxgeBg0Zph'
    '4IMhVa0Yb8QNkGvFjR1X7yikEM+IG1WmqQMK+3XINKXClxXn44kFZIc6Nph71PUW'
    '+RUEY+Xtpq40/bVz2OVXSNrkib/m6vSvu3arMXX6PwDORIb5w2RUUKPFtYiK8RnD'
    'jUi2Zb/fHfLeyhhQoeLYVsWdkJ3+mOPYap5SvNtbs+XgzGsACUMVGsCeEfAxU8ux'
    's0MXp+EAxTqkr+ueeCJWXtZwhP7GyH9nIPbD7yb2d9Us5V8+1jzsdSBlupUnOImJ'
    'tRJyKVUqfEpUeKSXmdGwLQ==';

void main() {
  group('RsaSignature.verifySha256', () {
    final data = utf8.encode('erp-update-test-payload');

    test('accepts the backend-format signature', () {
      expect(RsaSignature.verifySha256(data, _signature, _publicKeyPem), isTrue);
    });

    test('rejects tampered data', () {
      final tampered = utf8.encode('erp-update-test-payload!');
      expect(
        RsaSignature.verifySha256(tampered, _signature, _publicKeyPem),
        isFalse,
      );
    });

    test('rejects a tampered signature', () {
      final bytes = base64.decode(_signature);
      bytes[10] ^= 0x01;
      expect(
        RsaSignature.verifySha256(data, base64.encode(bytes), _publicKeyPem),
        isFalse,
      );
    });

    test('rejects garbage input without throwing', () {
      expect(RsaSignature.verifySha256(data, 'not-base64', _publicKeyPem), isFalse);
      expect(RsaSignature.verifySha256(data, _signature, 'not a pem'), isFalse);
    });
  });

  test('newUuidV4 produces RFC 4122 v4 UUIDs', () {
    final ids = List.generate(200, (_) => ApiService.newUuidV4());
    for (final id in ids) {
      expect(ApiService.uuidV4Pattern.hasMatch(id), isTrue, reason: id);
    }
    expect(ids.toSet().length, ids.length);
  });
}
