import 'package:flutter/material.dart';
import '../../models/component_tree.dart';
import '../../renderer/renderer.dart';
import '../../providers/auth_provider.dart';
import '../../utils/design_tokens.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class TabLayoutWidget extends ConsumerWidget {
  final ComponentNode node;
  final List<ComponentNode>? childNodes;
  final List<Widget>? children;

  const TabLayoutWidget({
    super.key,
    required this.node,
    this.childNodes,
    this.children,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissions = ref.watch(permissionCheckerProvider);
    // Tabs come from child nodes of kind "tab"
    final tabs = childNodes ?? node.children ?? [];
    if (tabs.isEmpty) {
      return const SizedBox.shrink();
    }

    return DefaultTabController(
      length: tabs.length,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TabBar(
            isScrollable: true,
            labelColor: Theme.of(context).colorScheme.primary,
            unselectedLabelColor: Theme.of(context).colorScheme.onSurfaceVariant,
            indicatorColor: Theme.of(context).colorScheme.primary,
            tabs: tabs.map((tab) {
              final label = tab.props?['label'] as String? ??
                  tab.props?['id'] as String? ??
                  'Tab';
              return Tab(text: label);
            }).toList(),
          ),
          Expanded(
            child: TabBarView(
              children: tabs.map((tab) {
                // Render tab's children
                final tabChildren = tab.children ?? [];
                if (tabChildren.isEmpty) {
                  return const Center(
                    child: Text('No content',
                        style: TextStyle(color: Colors.grey)),
                  );
                }
                final tokens = context.tokens;
                return SingleChildScrollView(
                  padding: EdgeInsets.all(tokens.spaceMd),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: tabChildren
                        .map((child) => renderNode(child, permissions))
                        .toList(),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
