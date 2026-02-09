import 'package:dio/dio.dart';

/// Preview params captured once at load time (before GoRouter navigation strips them).
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

class ApiClient {
  final Dio _dio;

  ApiClient({String? baseUrl})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl ?? 'http://localhost:3000/api/v1',
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 30),
        ));

  /// GET list endpoint with pagination, sort, filter, search
  Future<ListResponse> getList(
    String resource, {
    int page = 1,
    int pageSize = 25,
    String? sort,
    String? order,
    Map<String, dynamic>? filters,
    String? search,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'page_size': pageSize,
      ..._previewParams,
    };
    if (sort != null) params['sort'] = sort;
    if (order != null) params['order'] = order;
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (filters != null) {
      for (final entry in filters.entries) {
        final value = entry.value;
        if (value is Map) {
          for (final sub in value.entries) {
            params['filter[${entry.key}][${sub.key}]'] = sub.value;
          }
        } else if (value is List) {
          params['filter[${entry.key}]'] = value.join(',');
        } else {
          params['filter[${entry.key}]'] = value;
        }
      }
    }

    final response = await _dio.get(
      _normalizePath(resource),
      queryParameters: params,
    );
    final data = response.data as Map<String, dynamic>;
    return ListResponse(
      data: (data['data'] as List<dynamic>?)
              ?.map((e) => Map<String, dynamic>.from(e as Map))
              .toList() ??
          [],
      total: data['total'] as int? ?? 0,
      page: data['page'] as int? ?? page,
      pageSize: data['page_size'] as int? ?? pageSize,
    );
  }

  /// GET detail endpoint
  Future<Map<String, dynamic>> getDetail(String resource, String id) async {
    final response = await _dio.get(
      '${_normalizePath(resource)}/$id',
      queryParameters: _previewParams,
    );
    return response.data as Map<String, dynamic>;
  }

  /// POST create
  Future<Map<String, dynamic>> create(
      String resource, Map<String, dynamic> body) async {
    final response = await _dio.post(
      _normalizePath(resource),
      data: body,
      queryParameters: _previewParams,
    );
    return response.data as Map<String, dynamic>;
  }

  /// PATCH update
  Future<Map<String, dynamic>> update(
      String resource, String id, Map<String, dynamic> body) async {
    final response = await _dio.patch(
      '${_normalizePath(resource)}/$id',
      data: body,
      queryParameters: _previewParams,
    );
    return response.data as Map<String, dynamic>;
  }

  /// POST transition
  Future<Map<String, dynamic>> transition(
    String resource,
    String id,
    String transitionName, {
    Map<String, dynamic>? body,
  }) async {
    final response = await _dio.post(
      '${_normalizePath(resource)}/$id/transitions/$transitionName',
      data: body ?? {},
      queryParameters: _previewParams,
    );
    return response.data as Map<String, dynamic>;
  }

  String _normalizePath(String resource) {
    // api_resource in spec has leading slash (e.g., /subcontractors)
    if (resource.startsWith('/')) return resource;
    return '/$resource';
  }
}

class ListResponse {
  final List<Map<String, dynamic>> data;
  final int total;
  final int page;
  final int pageSize;

  const ListResponse({
    required this.data,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  int get totalPages => (total / pageSize).ceil();
}
