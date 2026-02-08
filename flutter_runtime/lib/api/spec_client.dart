import 'package:dio/dio.dart';
import '../models/component_tree.dart';

class SpecClient {
  final Dio _dio;

  SpecClient({String? baseUrl})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl ?? 'http://localhost:3000',
          connectTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 10),
        ));

  Future<ComponentTree> fetchSpec() async {
    final response = await _dio.get('/_renderer/spec');
    return ComponentTree.fromJson(response.data as Map<String, dynamic>);
  }
}
