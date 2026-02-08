import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../models/component_tree.dart';
import '../../utils/design_tokens.dart';
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

    final tokens = context.tokens;
    return Center(
      child: Padding(
        padding: EdgeInsets.all(tokens.spaceXl * 1.5),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              mapIcon(iconName),
              size: 64,
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
            SizedBox(height: tokens.spaceMd),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
            ),
            if (message != null) ...[
              SizedBox(height: tokens.spaceXs),
              Text(
                message,
                style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              SizedBox(height: tokens.spaceLg),
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
