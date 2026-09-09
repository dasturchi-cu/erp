import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:open_file/open_file.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'api_service.dart';

class UpdateInfo {
  final String releaseId;
  final String latestVersion;
  final String changelog;
  final String downloadUrl;
  final String checksum;

  UpdateInfo({
    required this.releaseId,
    required this.latestVersion,
    required this.changelog,
    required this.downloadUrl,
    required this.checksum,
  });
}

/// Checks the SaaS release system for a newer Android build, downloads it,
/// verifies its SHA-256, then hands it to Android's own installer via
/// open_file — Android always shows its own "install this app" prompt for a
/// non-Play-Store APK, so this can never be fully silent, only as automatic
/// as the platform allows.
class UpdateService {
  static final UpdateService _instance = UpdateService._internal();
  factory UpdateService() => _instance;
  UpdateService._internal();

  final _api = ApiService();

  Future<String> currentVersion() async {
    final info = await PackageInfo.fromPlatform();
    return info.version;
  }

  Future<UpdateInfo?> checkForUpdate() async {
    try {
      final version = await currentVersion();
      final companyId = _api.companyId;
      if (companyId == null) return null;

      final query = Uri(
        queryParameters: {
          'currentVersion': version,
          'companyId': companyId,
          'platform': 'android',
        },
      ).query;
      final res = await _api.get('/saas/updates/check?$query');
      final data = res.data;
      if (data is! Map || data['updateRequired'] != true) return null;

      final downloadUrl = data['downloadUrl']?.toString();
      final checksum = data['checksum']?.toString();
      if (downloadUrl == null || checksum == null) return null;

      return UpdateInfo(
        releaseId: data['releaseId']?.toString() ?? '',
        latestVersion: data['latestVersion']?.toString() ?? '',
        changelog: data['changelog']?.toString() ?? '',
        downloadUrl: downloadUrl,
        checksum: checksum,
      );
    } catch (_) {
      return null;
    }
  }

  /// Downloads the APK, verifies its checksum (throws on mismatch — never
  /// hands a corrupt/tampered file to the installer), and returns the local
  /// path. [onProgress] receives 0.0–1.0.
  Future<String> download(
    UpdateInfo info, {
    void Function(double)? onProgress,
  }) async {
    final dir = await getTemporaryDirectory();
    final filePath =
        '${dir.path}/erp-update-${DateTime.now().millisecondsSinceEpoch}.apk';

    final baseUri = Uri.parse(_api.dio.options.baseUrl);
    final fullUrl = Uri(
      scheme: baseUri.scheme,
      host: baseUri.host,
      port: baseUri.port,
      path: info.downloadUrl,
    ).toString();

    await _api.dio.download(
      fullUrl,
      filePath,
      onReceiveProgress: (received, total) {
        if (total > 0 && onProgress != null) onProgress(received / total);
      },
    );

    final bytes = await File(filePath).readAsBytes();
    final actual = sha256.convert(bytes).toString();
    if (actual.toLowerCase() != info.checksum.toLowerCase()) {
      await File(filePath).delete().catchError((_) => File(filePath));
      throw Exception('Yangilanish fayli buzilgan (checksum mos kelmadi)');
    }
    return filePath;
  }

  /// Opens Android's installer for the downloaded APK.
  Future<bool> install(String filePath) async {
    final result = await OpenFile.open(filePath);
    return result.type == ResultType.done;
  }

  Future<void> reportProgress({
    required String releaseId,
    required String previousVersion,
    required String currentVersion,
    required String status,
    String? failureReason,
  }) async {
    final companyId = _api.companyId;
    if (companyId == null) return;
    try {
      await _api.post('/saas/updates/report', {
        'companyId': companyId,
        'releaseId': releaseId,
        'previousVersion': previousVersion,
        'currentVersion': currentVersion,
        'status': status,
        if (failureReason != null) 'failureReason': failureReason,
      });
    } catch (_) {
      // Best-effort — must never block the actual update flow.
    }
  }
}
