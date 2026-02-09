import 'package:dio/dio.dart';
import '../models/component_tree.dart';

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

class SpecClient {
  final Dio _dio;

  SpecClient({String? baseUrl})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl ?? 'http://localhost:3000',
          connectTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 10),
        ));

  Future<ComponentTree> fetchSpec() async {
    final response = await _dio.get(
      '/_renderer/spec',
      queryParameters: _previewParams.isNotEmpty ? _previewParams : null,
    );
    return ComponentTree.fromJson(response.data as Map<String, dynamic>);
  }
}
