import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../api/api_client.dart';
import '../../models/component_tree.dart';
import '../../renderer/renderer.dart';
import '../../providers/auth_provider.dart';
import '../../utils/config.dart';
import '../../utils/icon_mapper.dart';
import 'relationship_table_widget.dart';

class EntityDetailWidget extends ConsumerStatefulWidget {
  final ComponentNode node;
  final List<ComponentNode> childNodes;

  const EntityDetailWidget({
    super.key,
    required this.node,
    required this.childNodes,
  });

  @override
  ConsumerState<EntityDetailWidget> createState() =>
      _EntityDetailWidgetState();
}

class _EntityDetailWidgetState extends ConsumerState<EntityDetailWidget> {
  final ApiClient _api = ApiClient(baseUrl: AppConfig.apiBaseUrl);
  Map<String, dynamic>? _record;
  bool _loading = true;
  bool _error = false;
  bool _hasFetched = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_hasFetched) {
      _hasFetched = true;
      _fetchRecord();
    }
  }

  Future<void> _fetchRecord() async {
    setState(() {
      _loading = true;
      _error = false;
    });

    try {
      final resource = widget.node.stringProp('api_resource') ?? '';
      final id = GoRouterState.of(context).pathParameters['id'] ?? '';
      if (kDebugMode) debugPrint('[EntityDetail] resource=$resource id=$id');
      if (resource.isEmpty || id.isEmpty) {
        if (kDebugMode) debugPrint('[EntityDetail] Empty resource or id');
        setState(() {
          _loading = false;
          _error = true;
        });
        return;
      }
      final record = await _api.getDetail(resource, id);
      setState(() {
        _record = record;
        _loading = false;
      });
    } catch (e) {
      if (kDebugMode) debugPrint('[EntityDetail] Error: $e');
      setState(() {
        _loading = false;
        _error = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error || _record == null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 48, color: Theme.of(context).colorScheme.error),
            const SizedBox(height: 8),
            const Text('Failed to load record'),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: _fetchRecord,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final permissions = ref.watch(permissionCheckerProvider);
    final fields = widget.node.listProp('fields') ?? [];
    final relationships = widget.node.listProp('relationships');
    final parentId = GoRouterState.of(context).pathParameters['id'] ?? '';

    // Separate child nodes by kind
    ComponentNode? headerNode;
    ComponentNode? tabLayoutNode;
    for (final child in widget.childNodes) {
      switch (child.kind) {
        case 'detail_header':
          headerNode = child;
          break;
        case 'tab_layout':
          tabLayoutNode = child;
          break;
      }
    }

    try {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Detail header
          if (headerNode != null)
            _injectRecordIntoNode(headerNode, _record!, fields, permissions),

          // Tab layout with sections
          if (tabLayoutNode != null)
            Expanded(
              child: _buildTabLayout(
                tabLayoutNode,
                _record!,
                fields,
                permissions,
                relationships,
                parentId,
              ),
            ),
        ],
      );
    } catch (e, stack) {
      if (kDebugMode) debugPrint('[EntityDetail] Render error: $e');
      if (kDebugMode) debugPrint('[EntityDetail] Stack: $stack');
      return Center(child: Text('Render error: $e', style: TextStyle(color: Theme.of(context).colorScheme.error)));
    }
  }

  Widget _injectRecordIntoNode(ComponentNode node, Map<String, dynamic> record,
      List<dynamic> fields, PermissionChecker permissions) {
    final modifiedNode = ComponentNode(
      id: node.id,
      kind: node.kind,
      props: {
        ...?node.props,
        '_record': record,
        '_fields': fields,
      },
      children: node.children,
      scope: node.scope,
      conditions: node.conditions,
    );
    return renderNode(modifiedNode, permissions);
  }

  Widget _buildTabLayout(
    ComponentNode tabLayout,
    Map<String, dynamic> record,
    List<dynamic> fields,
    PermissionChecker permissions,
    List<dynamic>? relationships,
    String parentId,
  ) {
    final tabs = tabLayout.children ?? [];
    if (tabs.isEmpty) {
      return const Center(child: Text('No tabs defined'));
    }

    // Filter tabs by permissions
    final visibleTabs = tabs.where((tab) {
      if (tab.conditions != null && tab.conditions!.isNotEmpty) {
        for (final cond in tab.conditions!) {
          if (cond.type == 'permission' && cond.roles != null) {
            if (!permissions.hasPermission(cond.roles)) return false;
          }
        }
      }
      return true;
    }).toList();

    if (visibleTabs.isEmpty) {
      return const Center(child: Text('No tabs available'));
    }

    return DefaultTabController(
      length: visibleTabs.length,
      child: Column(
        children: [
          TabBar(
            isScrollable: true,
            labelColor: Theme.of(context).colorScheme.primary,
            unselectedLabelColor: Theme.of(context).colorScheme.onSurfaceVariant,
            tabs: visibleTabs.map((tab) {
              final tabIcon = tab.props?['icon'] as String?;
              final tabLabel = tab.props?['label'] as String? ??
                  tab.props?['id'] as String? ??
                  'Tab';
              return Tab(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (tabIcon != null) ...[
                      Icon(mapIcon(tabIcon), size: 16),
                      const SizedBox(width: 6),
                    ],
                    Text(tabLabel),
                  ],
                ),
              );
            }).toList(),
          ),
          Expanded(
            child: TabBarView(
              children: visibleTabs.map((tab) {
                return _buildTabContent(
                  tab,
                  record,
                  fields,
                  permissions,
                  relationships,
                  parentId,
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabContent(
    ComponentNode tab,
    Map<String, dynamic> record,
    List<dynamic> fields,
    PermissionChecker permissions,
    List<dynamic>? relationships,
    String parentId,
  ) {
    // Check for content type (e.g., relationship_table)
    final content = tab.props?['content'];
    if (content is Map) {
      final contentType = content['type'] as String?;
      if (contentType == 'relationship_table' && relationships != null) {
        final relName = content['relationship'] as String?;
        final rel = relationships.cast<Map>().firstWhere(
          (r) => r['name'] == relName,
          orElse: () => <String, dynamic>{},
        );
        if (rel.isNotEmpty && parentId.isNotEmpty) {
          final columns = (content['columns'] as List?)
              ?.map((c) => c.toString())
              .toList();
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: RelationshipTableWidget(
              relationship: Map<String, dynamic>.from(rel),
              parentId: parentId,
              columns: columns,
            ),
          );
        }
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'Relationship "$relName" not found',
            style: TextStyle(color: Theme.of(context).colorScheme.outline, fontSize: 13),
          ),
        );
      }
      // Other content types
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text(
            'Content type "$contentType" \u2014 coming soon',
            style: TextStyle(color: Theme.of(context).colorScheme.outline, fontSize: 13),
          ),
        ),
      );
    }

    // Default: render section children with record + fields injected
    final tabChildren = tab.children ?? [];
    if (tabChildren.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Text(
          'No content configured for this tab',
          style: TextStyle(color: Theme.of(context).colorScheme.outline, fontSize: 13),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: tabChildren.map((child) {
          // Check section-level permissions
          if (child.conditions != null && child.conditions!.isNotEmpty) {
            for (final cond in child.conditions!) {
              if (cond.type == 'permission' && cond.roles != null) {
                if (!permissions.hasPermission(cond.roles)) {
                  return const SizedBox.shrink();
                }
              }
            }
          }

          if (child.kind == 'section') {
            return _injectRecordIntoNode(child, record, fields, permissions);
          }
          return renderNode(child, permissions);
        }).toList(),
      ),
    );
  }
}
