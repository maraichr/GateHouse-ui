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

class NavBadgeParams {
  final Map<String, dynamic> badge;
  final String? apiResource;

  const NavBadgeParams({required this.badge, this.apiResource});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is NavBadgeParams &&
          badge.toString() == other.badge.toString() &&
          apiResource == other.apiResource;

  @override
  int get hashCode => Object.hash(badge.toString(), apiResource);
}

/// Resolves nav badge config to an actual count number.
/// Two strategies (matching React useNavBadge.ts):
///   1. Direct source: badge.source → strip "api:" → GET endpoint → extract count/total
///   2. Filter count: badge.type == 'count' → GET api_resource?page_size=0&filter[k]=v → extract total
final navBadgeProvider =
    FutureProvider.family<int?, NavBadgeParams>((ref, params) async {
  final badge = params.badge;
  final apiResource = params.apiResource;

  final dio = Dio(BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  // Strategy 1: Direct source endpoint
  final source = badge['source'] as String?;
  if (source != null && source.isNotEmpty) {
    final endpoint = source.replaceFirst(RegExp(r'^api:'), '');
    final response = await dio.get(
      endpoint,
      queryParameters: _previewParams.isNotEmpty ? _previewParams : null,
    );
    final data = response.data;
    if (data is num) return data.toInt();
    if (data is Map) {
      return (data['count'] as num?)?.toInt() ??
          (data['total'] as num?)?.toInt();
    }
    return null;
  }

  // Strategy 2: Count via list endpoint with filter
  final type = badge['type'] as String?;
  if (type == 'count' && apiResource != null && apiResource.isNotEmpty) {
    final queryParams = <String, dynamic>{
      'page_size': '0',
      ..._previewParams,
    };
    final filter = badge['filter'];
    if (filter is Map) {
      for (final entry in filter.entries) {
        queryParams['filter[${entry.key}]'] = entry.value.toString();
      }
    }
    final path =
        apiResource.startsWith('/') ? apiResource : '/$apiResource';
    final response = await dio.get(path, queryParameters: queryParams);
    final data = response.data;
    if (data is Map) {
      return (data['total'] as num?)?.toInt();
    }
    return null;
  }

  return null;
});
