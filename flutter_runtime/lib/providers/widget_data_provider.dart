import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../utils/config.dart';

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

  final response = await dio.get(parsed);
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
