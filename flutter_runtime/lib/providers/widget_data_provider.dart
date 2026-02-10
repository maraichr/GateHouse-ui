import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../utils/config.dart';

/// Preview params captured once at load time (specId, compId, versionId).
final Map<String, String> _previewParams = () {
  final params = Uri.base.queryParameters;
  final result = <String, String>{};
  for (final key in ['specId', 'versionId', 'compId']) {
    final val = params[key];
    if (val != null && val.isNotEmpty) {
      result[key] = val;
    }
  }
  return result;
}();

/// Parses "api:GET /dashboard/stats" source strings and fetches widget data.
/// Family provider keyed by source string — each unique source gets its own cache.
final widgetDataProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, source) async {
  final parsed = _parseSource(source);
  if (parsed == null) return {};

  final dio = Dio(BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  final response = await dio.get(
    parsed,
    queryParameters: _previewParams.isNotEmpty ? _previewParams : null,
  );
  if (response.data is Map) {
    return Map<String, dynamic>.from(response.data as Map);
  }
  return {'data': response.data};
});

/// Parses source string like "api:GET /dashboard/stats" → "/dashboard/stats"
String? _parseSource(String source) {
  final match = RegExp(r'^api:(?:GET\s+)?(.+)$', caseSensitive: false)
      .firstMatch(source);
  return match?.group(1)?.trim();
}
