import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';

/// SSE listener for hot reload events from the Go server.
class HotReloadClient {
  final String baseUrl;
  StreamSubscription<String>? _subscription;
  final _controller = StreamController<String>.broadcast();

  HotReloadClient({this.baseUrl = 'http://localhost:3000'});

  Stream<String> get events => _controller.stream;

  Future<void> connect() async {
    try {
      final dio = Dio();
      final response = await dio.get(
        '$baseUrl/_renderer/events',
        options: Options(
          responseType: ResponseType.stream,
          headers: {'Accept': 'text/event-stream'},
        ),
      );

      final stream = (response.data as ResponseBody).stream;
      _subscription = stream
          .cast<List<int>>()
          .transform(utf8.decoder)
          .transform(const LineSplitter())
          .listen((line) {
        if (line.startsWith('data: ')) {
          final data = line.substring(6).trim();
          if (data.isNotEmpty) {
            _controller.add(data);
          }
        }
      }, onError: (error) {
        // Reconnect after error
        Future.delayed(const Duration(seconds: 2), connect);
      }, onDone: () {
        // Reconnect when stream closes
        Future.delayed(const Duration(seconds: 2), connect);
      });
    } catch (_) {
      // Retry connection
      Future.delayed(const Duration(seconds: 2), connect);
    }
  }

  void dispose() {
    _subscription?.cancel();
    _controller.close();
  }
}
