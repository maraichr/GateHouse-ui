import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/spec_client.dart';
import '../api/hot_reload.dart';
import '../models/component_tree.dart';
import '../utils/config.dart';

/// Provides the component tree from the Go server
final specProvider = FutureProvider<ComponentTree>((ref) async {
  final client = SpecClient(baseUrl: AppConfig.goServerUrl);
  return client.fetchSpec();
});

/// Hot reload listener that invalidates specProvider on reload events
final hotReloadProvider = Provider<HotReloadClient>((ref) {
  final client = HotReloadClient(baseUrl: AppConfig.goServerUrl);
  client.connect();

  client.events.listen((event) {
    if (event == 'reload' || event.contains('reload')) {
      ref.invalidate(specProvider);
    }
  });

  ref.onDispose(() => client.dispose());
  return client;
});
