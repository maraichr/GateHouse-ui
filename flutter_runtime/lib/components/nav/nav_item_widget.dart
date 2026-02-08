import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/component_tree.dart';
import '../../providers/nav_badge_provider.dart';
import '../../utils/design_tokens.dart';
import '../../utils/icon_mapper.dart';
import '../../utils/theme_colors.dart';

class NavItemWidget extends ConsumerWidget {
  final ComponentNode node;

  const NavItemWidget({super.key, required this.node});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final label = node.stringProp('label') ?? '';
    final iconName = node.stringProp('icon');
    final path = node.stringProp('path') ?? node.scope?.route ?? '';
    final badge = node.props?['badge'];
    final apiResource = node.stringProp('api_resource');

    final currentPath = GoRouterState.of(context).uri.path;
    final isActive = currentPath == path ||
        (path.length > 1 && currentPath.startsWith(path));

    final colorScheme = Theme.of(context).colorScheme;
    final tokens = context.tokens;

    // Resolve badge count via provider when badge is a Map config
    Widget? badgeWidget;
    if (badge is Map) {
      final badgeMap = Map<String, dynamic>.from(badge);
      final params =
          NavBadgeParams(badge: badgeMap, apiResource: apiResource);
      final asyncCount = ref.watch(navBadgeProvider(params));
      badgeWidget = asyncCount.when(
        data: (count) {
          if (count == null || count <= 0) return null;
          return _buildBadgePill(count.toString(), badgeMap, colorScheme);
        },
        loading: () => null,
        error: (_, __) => null,
      );
    } else if (badge is num) {
      if (badge > 0) {
        badgeWidget = _buildBadgePill(
            badge.toString(), {}, colorScheme);
      }
    } else if (badge is String) {
      final parsed = int.tryParse(badge);
      if (parsed != null && parsed > 0) {
        badgeWidget = _buildBadgePill(badge, {}, colorScheme);
      }
    }

    return ListTile(
      leading: Icon(
        mapIcon(iconName),
        size: 20,
        color: isActive ? colorScheme.primary : colorScheme.onSurfaceVariant,
      ),
      title: Text(
        label,
        style: TextStyle(
          fontSize: tokens.fontBase,
          fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
          color: isActive ? colorScheme.primary : colorScheme.onSurface,
        ),
      ),
      trailing: badgeWidget,
      selected: isActive,
      selectedTileColor: colorScheme.primary.withValues(alpha: 0.08),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(tokens.radiusMd)),
      contentPadding: EdgeInsets.symmetric(horizontal: tokens.spaceMd, vertical: 0),
      dense: true,
      onTap: () {
        if (path.isNotEmpty) {
          context.go(path);
          final scaffold = Scaffold.maybeOf(context);
          if (scaffold?.isDrawerOpen ?? false) {
            Navigator.of(context).pop();
          }
        }
      },
    );
  }

  Widget _buildBadgePill(
      String text, Map<String, dynamic> badgeConfig, ColorScheme colorScheme) {
    final colorName = badgeConfig['color'] as String?;
    final Color bgColor;
    final Color fgColor;

    final semantic = semanticColor(colorName ?? 'primary', colorScheme: colorScheme);
    bgColor = semantic.withValues(alpha: 0.1);
    fgColor = semantic;

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 48),
      child: Builder(builder: (context) {
        final tokens = context.tokens;
        return Container(
          padding: EdgeInsets.symmetric(horizontal: tokens.spaceXs * 0.75, vertical: 2),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(tokens.radiusSm + 2),
          ),
          child: Text(
            text,
            style: TextStyle(
              fontSize: tokens.fontXs,
              fontWeight: FontWeight.w600,
              color: fgColor,
            ),
            textAlign: TextAlign.center,
            overflow: TextOverflow.ellipsis,
          ),
        );
      }),
    );
  }
}
