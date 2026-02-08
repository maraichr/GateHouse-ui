import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../models/component_tree.dart';
import '../../utils/icon_mapper.dart';

class EmptyStateWidget extends StatelessWidget {
  final ComponentNode node;

  const EmptyStateWidget({super.key, required this.node});

  @override
  Widget build(BuildContext context) {
    final config = node.mapProp('config') ?? node.props ?? {};
    final iconName = config['icon'] as String?;
    final title = config['title'] as String? ?? 'No items';
    final message = config['message'] as String?;
    final action = config['action'] as Map<String, dynamic>?;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              mapIcon(iconName),
              size: 64,
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
            ),
            if (message != null) ...[
              const SizedBox(height: 8),
              Text(
                message,
                style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () {
                  final path = action['path'] as String?;
                  if (path != null) context.go(path);
                },
                icon: const Icon(Icons.add, size: 18),
                label: Text(action['label'] as String? ?? 'Add'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
