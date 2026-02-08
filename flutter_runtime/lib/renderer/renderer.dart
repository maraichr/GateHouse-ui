import 'package:flutter/material.dart';
import '../models/component_tree.dart';
import '../providers/auth_provider.dart';
import '../components/layout/app_shell.dart';
import '../components/layout/sidebar_widget.dart';
import '../components/layout/tab_layout_widget.dart';
import '../components/layout/section_widget.dart';
import '../components/nav/nav_item_widget.dart';
import '../components/nav/nav_group_widget.dart';
import '../components/entity/entity_list_widget.dart';
import '../components/entity/entity_detail_widget.dart';
import '../components/entity/detail_header_widget.dart';
import '../components/entity/data_list_widget.dart';
import '../components/entity/empty_state_widget.dart';
import '../components/form/dynamic_form_widget.dart';
import '../components/form/stepped_form_widget.dart';
import '../components/widgets/stat_cards_widget.dart';
import '../components/widgets/chart_widget.dart';
import '../components/widgets/entity_table_widget.dart';
import '../components/entity/relationship_table_widget.dart';
import '../utils/icon_mapper.dart';

/// Kinds whose children are passed as raw ComponentNode list (not rendered widgets)
const childNodeKinds = {
  'entity_list',
  'entity_detail',
  'create_form',
  'edit_form',
  'stepped_form',
};

/// Component registry mapping kind strings to builder functions.
typedef ComponentBuilder = Widget Function(
  ComponentNode node,
  List<ComponentNode>? childNodes,
  List<Widget>? renderedChildren,
);

final Map<String, ComponentBuilder> componentMap = {
  'app_shell': (node, _, children) =>
      AppShellWidget(node: node, children: children ?? []),
  'sidebar': (node, _, children) =>
      SidebarWidget(node: node, children: children ?? []),
  'nav_item': (node, _, __) => NavItemWidget(node: node),
  'nav_group': (node, _, children) =>
      NavGroupWidget(node: node, children: children ?? []),
  'tab_layout': (node, childNodes, children) =>
      TabLayoutWidget(node: node, childNodes: childNodes, children: children),
  'tab': (node, _, children) => _TabContent(children: children ?? []),
  'section': (node, _, __) => SectionWidget(node: node),
  'entity_list': (node, childNodes, _) =>
      EntityListWidget(node: node, childNodes: childNodes ?? []),
  'entity_detail': (node, childNodes, _) =>
      EntityDetailWidget(node: node, childNodes: childNodes ?? []),
  'detail_header': (node, _, __) => DetailHeaderWidget(node: node),
  'data_table': (node, _, __) =>
      DataListWidget(node: node), // Flutter uses card list
  'filter_panel': (node, _, __) =>
      const SizedBox.shrink(), // Handled by EntityList
  'search_bar': (node, _, __) =>
      const SizedBox.shrink(), // Handled by EntityList
  'empty_state': (node, _, __) => EmptyStateWidget(node: node),
  'create_form': (node, childNodes, _) =>
      DynamicFormWidget(node: node, childNodes: childNodes ?? []),
  'edit_form': (node, childNodes, _) =>
      DynamicFormWidget(node: node, childNodes: childNodes ?? []),
  'stepped_form': (node, childNodes, _) =>
      SteppedFormWidget(node: node, childNodes: childNodes ?? []),
  'form_step': (node, _, __) => const SizedBox.shrink(), // Handled by form
  'form_section': (node, _, __) =>
      const SizedBox.shrink(), // Handled by form
  'page': (node, _, children) =>
      _PageContent(node: node, children: children ?? []),
  'custom_page': (node, _, children) =>
      _PageContent(node: node, children: children ?? []),
  'relationship_view': (node, _, __) {
    final rel = node.mapProp('relationship') ?? node.props ?? {};
    final parentId = node.stringProp('parent_id') ?? '';
    return RelationshipTableWidget(
      relationship: rel,
      parentId: parentId,
    );
  },
  'stat_cards': (node, _, __) => StatCardsWidget(node: node),
  'chart': (node, _, __) => ChartWidget(node: node),
  'entity_table_widget': (node, _, __) => EntityTableWidget(node: node),
};

/// Recursive render function — the heart of the renderer
Widget renderNode(ComponentNode node, PermissionChecker permissions) {
  // Permission check
  if (node.conditions != null && node.conditions!.isNotEmpty) {
    final condMaps = node.conditions!
        .map((c) => <String, dynamic>{'type': c.type, 'roles': c.roles})
        .toList();
    if (!permissions.checkConditions(condMaps)) {
      return const SizedBox.shrink();
    }
  }

  final builder = componentMap[node.kind];
  if (builder == null) {
    return _PlaceholderWidget(kind: node.kind, id: node.id);
  }

  if (childNodeKinds.contains(node.kind)) {
    // Pass raw child nodes instead of rendering them
    return builder(node, node.children, null);
  }

  // Render children first, then pass rendered widgets
  final renderedChildren = node.children
          ?.map((child) => renderNode(child, permissions))
          .toList() ??
      [];
  return builder(node, null, renderedChildren);
}

class _TabContent extends StatelessWidget {
  final List<Widget> children;
  const _TabContent({required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: children,
    );
  }
}

class _PageContent extends StatelessWidget {
  final ComponentNode node;
  final List<Widget> children;
  const _PageContent({required this.node, required this.children});

  @override
  Widget build(BuildContext context) {
    final title = node.stringProp('title');
    final icon = node.stringProp('icon');
    final description = node.stringProp('description');
    final layout = node.stringProp('layout');
    final columns = (node.prop<num>('columns') ?? 2).toInt();

    if (children.isEmpty) {
      return Center(
        child: Text('Page content coming soon',
            style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
      );
    }

    final isGrid = layout == 'grid' || layout == null;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Page header
          if (title != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Row(
                children: [
                  if (icon != null) ...[
                    Icon(mapIcon(icon), size: 24, color: Theme.of(context).colorScheme.onSurfaceVariant),
                    const SizedBox(width: 8),
                  ],
                  Text(title,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          if (description != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(description,
                  style: TextStyle(
                      fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ),
          // Grid layout
          if (isGrid)
            LayoutBuilder(
              builder: (context, constraints) {
                final responsiveCols = _responsiveCols(constraints.maxWidth, columns);
                final spacing = 16.0;
                final childWidth =
                    (constraints.maxWidth - (responsiveCols - 1) * spacing) /
                        responsiveCols;

                return Wrap(
                  spacing: spacing,
                  runSpacing: spacing,
                  children: children
                      .map((child) => SizedBox(
                            width: _isFullWidth(child)
                                ? constraints.maxWidth
                                : childWidth,
                            child: child,
                          ))
                      .toList(),
                );
              },
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
        ],
      ),
    );
  }

  int _responsiveCols(double width, int desired) {
    if (width < 500) return 1;
    if (width < 800) return desired.clamp(1, 2);
    return desired.clamp(1, 4);
  }

  /// StatCardsWidget spans full width (it manages its own grid)
  bool _isFullWidth(Widget child) {
    return child is StatCardsWidget;
  }
}

class _PlaceholderWidget extends StatelessWidget {
  final String kind;
  final String? id;
  const _PlaceholderWidget({required this.kind, this.id});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        border: Border.all(color: Theme.of(context).dividerColor),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '[$kind${id != null ? ': $id' : ''}]',
        style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 12),
      ),
    );
  }
}
