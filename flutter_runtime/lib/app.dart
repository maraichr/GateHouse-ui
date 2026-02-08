import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'models/component_tree.dart';
import 'providers/spec_provider.dart';
import 'providers/auth_provider.dart';
import 'renderer/renderer.dart';
import 'utils/theme_colors.dart';
import 'utils/config.dart';
import 'utils/design_tokens.dart';
import 'components/layout/global_search.dart';
import 'components/layout/notification_bell.dart';
import 'components/layout/breadcrumbs_widget.dart';

/// Sidebar width constant (not density-dependent).
const double _kSidebarWidth = 260;

class GateHouseApp extends ConsumerWidget {
  const GateHouseApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final specAsync = ref.watch(specProvider);
    ref.watch(hotReloadProvider);

    return specAsync.when(
      loading: () => MaterialApp(
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Builder(builder: (context) => Text('Loading spec...',
                    style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant))),
              ],
            ),
          ),
        ),
      ),
      error: (error, stack) => MaterialApp(
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Builder(builder: (context) => Icon(Icons.error_outline, size: 48, color: Theme.of(context).colorScheme.error)),
                const SizedBox(height: 16),
                const Text('Failed to load spec'),
                const SizedBox(height: 8),
                Builder(builder: (context) => Text(error.toString(),
                    style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant))),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.invalidate(specProvider),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
      data: (tree) => _AppWithRouter(tree: tree),
    );
  }
}

class _AppWithRouter extends ConsumerWidget {
  final ComponentTree tree;
  const _AppWithRouter({required this.tree});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissions = ref.watch(permissionCheckerProvider);
    final theme = tree.root.props?['theme'] as Map<String, dynamic>?;
    final appName = tree.root.stringProp('app_name') ?? 'GateHouse';
    final entities = tree.metadata.entities;
    final shell = tree.root.mapProp('shell');
    final rawHeader = shell?['header'];
    final headerConfig = rawHeader is Map
        ? Map<String, dynamic>.from(rawHeader)
        : null;

    final router = _buildRouter(tree, permissions, appName, entities, headerConfig);

    // Wrap the whole app in GlobalSearchShortcut for Ctrl+K / Cmd+K
    return GlobalSearchShortcut(
      entities: entities,
      child: MaterialApp.router(
        title: appName,
        theme: buildThemeFromSpec(theme),
        routerConfig: router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

GoRouter _buildRouter(
  ComponentTree tree,
  PermissionChecker permissions,
  String appName,
  List<String> entities,
  Map<String, dynamic>? headerConfig,
) {
  ComponentNode? sidebarNode;
  for (final child in tree.root.children ?? []) {
    if (child.kind == 'sidebar') {
      sidebarNode = child;
      break;
    }
  }

  final routedNodes = <ComponentNode>[];
  for (final child in tree.root.children ?? []) {
    if (child.scope?.route != null && child.scope!.route!.isNotEmpty) {
      routedNodes.add(child);
    }
  }

  // Resolve logo URL from theme
  final theme = tree.root.props?['theme'] as Map<String, dynamic>?;
  final rawLogo = theme?['logo'];
  String? logoUrl;
  if (rawLogo is String) {
    logoUrl = rawLogo;
  } else if (rawLogo is Map) {
    logoUrl = rawLogo['light'] as String? ?? rawLogo['dark'] as String?;
  } else {
    logoUrl = null;
  }
  // Resolve relative paths against the Go server
  if (logoUrl != null && logoUrl.startsWith('/')) {
    logoUrl = '${AppConfig.goServerUrl}$logoUrl';
  }

  final routes = routedNodes.map((node) {
    final route = node.scope!.route!;
    return GoRoute(
      path: route,
      builder: (context, state) => _ResponsiveShell(
        sidebarNode: sidebarNode,
        permissions: permissions,
        pageNode: node,
        appName: appName,
        logoUrl: logoUrl,
        entities: entities,
        headerConfig: headerConfig,
      ),
    );
  }).toList();

  return GoRouter(
    initialLocation: '/dashboard',
    routes: routes.isNotEmpty
        ? routes
        : [
            GoRoute(
              path: '/',
              builder: (context, state) => _ResponsiveShell(
                sidebarNode: sidebarNode,
                permissions: permissions,
                pageNode: null,
                appName: appName,
                logoUrl: logoUrl,
                entities: entities,
                headerConfig: headerConfig,
              ),
            ),
          ],
  );
}

// ---------------------------------------------------------------------------
// Responsive Shell — persistent sidebar on wide, drawer on narrow
// ---------------------------------------------------------------------------

class _ResponsiveShell extends ConsumerWidget {
  final ComponentNode? sidebarNode;
  final PermissionChecker permissions;
  final ComponentNode? pageNode;
  final String appName;
  final String? logoUrl;
  final List<String> entities;
  final Map<String, dynamic>? headerConfig;

  const _ResponsiveShell({
    required this.sidebarNode,
    required this.permissions,
    required this.pageNode,
    required this.appName,
    this.logoUrl,
    required this.entities,
    this.headerConfig,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final showSearch = headerConfig?['show_search'] != false &&
        headerConfig?['show_global_search'] != false;
    final showNotifications = headerConfig?['show_notifications'] != false;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= GHTokens.breakpointMd;

        if (isWide) {
          // Desktop layout: persistent sidebar + header + content
          return Row(
            children: [
              if (sidebarNode != null)
                SizedBox(
                  width: _kSidebarWidth,
                  child: _PersistentSidebar(
                    sidebarNode: sidebarNode!,
                    permissions: permissions,
                    appName: appName,
                    logoUrl: logoUrl,
                  ),
                ),
              Expanded(
                child: Scaffold(
                  appBar: _buildAppBar(
                    context, ref,
                    showSearch: showSearch,
                    showNotifications: showNotifications,
                    showMenuButton: false,
                  ),
                  body: Column(
                    children: [
                      // Breadcrumbs bar (matching React Header)
                      _HeaderBar(showSearch: false, showNotifications: false),
                      Expanded(
                        child: pageNode != null
                            ? renderNode(pageNode!, permissions)
                            : const Center(child: Text('Select a page')),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        }

        // Mobile layout: drawer
        return Scaffold(
          appBar: _buildAppBar(
            context, ref,
            showSearch: showSearch,
            showNotifications: showNotifications,
            showMenuButton: true,
          ),
          drawer: sidebarNode != null
              ? Drawer(
                  child: _PersistentSidebar(
                    sidebarNode: sidebarNode!,
                    permissions: permissions,
                    appName: appName,
                    logoUrl: logoUrl,
                  ),
                )
              : null,
          body: pageNode != null
              ? renderNode(pageNode!, permissions)
              : const Center(child: Text('Select a page')),
        );
      },
    );
  }

  AppBar _buildAppBar(
    BuildContext context, WidgetRef ref, {
    required bool showSearch,
    required bool showNotifications,
    required bool showMenuButton,
  }) {
    final currentRole = ref.watch(currentRoleProvider);

    return AppBar(
      automaticallyImplyLeading: showMenuButton,
      title: Builder(builder: (ctx) {
        final tokens = ctx.tokens;
        return Text(
          _pageTitle(),
          style: TextStyle(fontSize: tokens.fontLg, fontWeight: FontWeight.w600),
        );
      }),
      actions: [
        if (showSearch)
          GlobalSearchButton(entities: entities),
        if (showNotifications)
          const NotificationBell(),
        // Role switcher (dev tool)
        PopupMenuButton<String>(
          tooltip: 'Role: $currentRole',
          icon: const Icon(Icons.person_outline, size: 20),
          onSelected: (role) {
            ref.read(currentRoleProvider.notifier).state = role;
          },
          itemBuilder: (_) => [
            PopupMenuItem(
              value: 'admin',
              child: _roleMenuItem('Admin', currentRole == 'admin'),
            ),
            PopupMenuItem(
              value: 'compliance_officer',
              child: _roleMenuItem('Compliance Officer', currentRole == 'compliance_officer'),
            ),
            PopupMenuItem(
              value: 'viewer',
              child: _roleMenuItem('Viewer', currentRole == 'viewer'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _roleMenuItem(String label, bool isActive) {
    return Row(
      children: [
        if (isActive)
          const Icon(Icons.check, size: 16)
        else
          const SizedBox(width: 16),
        const SizedBox(width: 8),
        Text(label),
      ],
    );
  }

  String _pageTitle() {
    return pageNode?.stringProp('title') ??
        pageNode?.stringProp('label') ??
        pageNode?.id ??
        appName;
  }
}

// ---------------------------------------------------------------------------
// Header bar with breadcrumbs (sits between AppBar and content)
// ---------------------------------------------------------------------------

class _HeaderBar extends StatelessWidget {
  final bool showSearch;
  final bool showNotifications;

  const _HeaderBar({
    required this.showSearch,
    required this.showNotifications,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      height: 40,
      padding: EdgeInsets.symmetric(horizontal: tokens.spaceMd),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border(
          bottom: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
        ),
      ),
      child: const Row(
        children: [
          Expanded(child: BreadcrumbsWidget()),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Persistent sidebar with branding + nav items
// ---------------------------------------------------------------------------

class _PersistentSidebar extends StatelessWidget {
  final ComponentNode sidebarNode;
  final PermissionChecker permissions;
  final String appName;
  final String? logoUrl;

  const _PersistentSidebar({
    required this.sidebarNode,
    required this.permissions,
    required this.appName,
    this.logoUrl,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final colorScheme = Theme.of(context).colorScheme;
    return Material(
      color: colorScheme.surface,
      child: Column(
        children: [
          // Branding header
          Container(
            padding: EdgeInsets.symmetric(horizontal: tokens.spaceMd, vertical: tokens.spaceXl * 0.625),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: colorScheme.outlineVariant),
              ),
            ),
            child: Row(
              children: [
                if (logoUrl != null && logoUrl!.isNotEmpty) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(tokens.radiusMd),
                    child: Image.network(
                      logoUrl!,
                      height: 28,
                      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                    ),
                  ),
                  SizedBox(width: tokens.spaceSm),
                ],
                Flexible(
                  child: Text(
                    appName,
                    style: TextStyle(
                      fontSize: tokens.fontLg + 1,
                      fontWeight: FontWeight.w600,
                      color: colorScheme.onSurface,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          // Nav items
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                border: Border(
                  right: BorderSide(color: colorScheme.outlineVariant),
                ),
              ),
              child: renderNode(sidebarNode, permissions),
            ),
          ),
        ],
      ),
    );
  }
}
