import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../utils/string_utils.dart';

/// Clickable breadcrumbs matching React Breadcrumbs component.
/// Parses the current path and renders Home > Segment > Segment.
class BreadcrumbsWidget extends StatelessWidget {
  const BreadcrumbsWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final path = GoRouterState.of(context).uri.path;
    final segments = path.split('/').where((s) => s.isNotEmpty).toList();

    if (segments.isEmpty) return const SizedBox.shrink();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Home icon
          InkWell(
            borderRadius: BorderRadius.circular(4),
            onTap: () => context.go('/dashboard'),
            child: Icon(LucideIcons.house,
                size: 15, color: Theme.of(context).colorScheme.outline),
          ),
          // Crumb segments
          for (var i = 0; i < segments.length; i++) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Icon(LucideIcons.chevronRight,
                  size: 12, color: Theme.of(context).colorScheme.outlineVariant),
            ),
            if (i == segments.length - 1)
              // Last crumb: non-clickable, bold
              Text(
                humanize(segments[i]),
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              )
            else
              // Intermediate crumbs: clickable
              InkWell(
                borderRadius: BorderRadius.circular(4),
                onTap: () {
                  final targetPath =
                      '/${segments.sublist(0, i + 1).join('/')}';
                  context.go(targetPath);
                },
                child: Text(
                  humanize(segments[i]),
                  style: TextStyle(
                    fontSize: 13,
                    color: Theme.of(context).colorScheme.outline,
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }

}
