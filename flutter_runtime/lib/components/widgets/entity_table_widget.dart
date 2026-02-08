import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../api/api_client.dart';
import '../../models/component_tree.dart';
import '../../utils/config.dart';

/// Provider that fetches entity list data for dashboard table widgets.
final _entityTableProvider = FutureProvider.family<ListResponse, _EntityTableArgs>(
  (ref, args) async {
    final client = ApiClient(baseUrl: AppConfig.apiBaseUrl);
    return client.getList(
      args.resource,
      pageSize: args.limit,
      sort: args.sort,
      order: args.order,
      filters: args.filters,
    );
  },
);

class _EntityTableArgs {
  final String resource;
  final int limit;
  final String? sort;
  final String? order;
  final Map<String, dynamic>? filters;

  const _EntityTableArgs({
    required this.resource,
    this.limit = 5,
    this.sort,
    this.order,
    this.filters,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is _EntityTableArgs &&
          resource == other.resource &&
          limit == other.limit &&
          sort == other.sort &&
          order == other.order;

  @override
  int get hashCode => Object.hash(resource, limit, sort, order);
}

class EntityTableWidget extends ConsumerWidget {
  final ComponentNode node;
  const EntityTableWidget({super.key, required this.node});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final title = node.stringProp('title');
    final entity = node.stringProp('entity');
    final columns = _normalizeColumns(node.listProp('columns'));
    final query = node.mapProp('query');
    final link = node.stringProp('link');

    final resource = _resolveApiResource(entity);
    final sortMap = query?['sort'] as Map?;
    final limit = (query?['limit'] as num?)?.toInt() ?? 5;
    final filters = query?['filter'] as Map<String, dynamic>?;

    final args = _EntityTableArgs(
      resource: resource,
      limit: limit,
      sort: sortMap?['field'] as String?,
      order: sortMap?['order'] as String?,
      filters: filters,
    );

    final asyncData = ref.watch(_entityTableProvider(args));

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: Colors.grey.shade200),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title ?? entity ?? 'Records',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade700)),
                if (link != null)
                  InkWell(
                    onTap: () => context.go(link),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('View All',
                            style: TextStyle(
                                fontSize: 12,
                                color: Theme.of(context).colorScheme.primary)),
                        const SizedBox(width: 2),
                        Icon(LucideIcons.arrowRight,
                            size: 12,
                            color: Theme.of(context).colorScheme.primary),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          // Table body
          asyncData.when(
            loading: () => _buildLoading(),
            error: (_, __) => _buildError(),
            data: (response) {
              if (response.data.isEmpty) return _buildEmpty();
              return _buildTable(context, response.data, columns);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTable(BuildContext context, List<Map<String, dynamic>> rows,
      List<String> columns) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowHeight: 36,
        dataRowMinHeight: 36,
        dataRowMaxHeight: 44,
        columnSpacing: 24,
        horizontalMargin: 16,
        headingTextStyle: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: Colors.grey.shade500,
          letterSpacing: 0.5,
        ),
        columns: columns
            .map((col) => DataColumn(
                  label: Text(_formatHeader(col)),
                ))
            .toList(),
        rows: rows
            .map((row) => DataRow(
                  cells: columns
                      .map((col) => DataCell(
                            Text(_formatCellValue(row[col]),
                                style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.grey.shade700)),
                          ))
                      .toList(),
                ))
            .toList(),
      ),
    );
  }

  Widget _buildLoading() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: List.generate(
          3,
          (_) => Container(
            height: 32,
            margin: const EdgeInsets.symmetric(vertical: 4),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Text('No records',
            style: TextStyle(fontSize: 13, color: Colors.grey.shade400)),
      ),
    );
  }

  Widget _buildError() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Text('Failed to load data',
            style: TextStyle(fontSize: 13, color: Colors.red.shade600)),
      ),
    );
  }

  List<String> _normalizeColumns(List<dynamic>? columns) {
    if (columns == null) return [];
    return columns.map((c) {
      if (c is String) return c;
      if (c is Map) return (c['field'] as String?) ?? '';
      return c.toString();
    }).where((c) => c.isNotEmpty).toList();
  }

  /// PascalCase entity name → kebab-case resource path
  String _resolveApiResource(String? entity) {
    if (entity == null || entity.isEmpty) return '/unknown';
    final kebab = entity
        .replaceAllMapped(
            RegExp(r'([a-z])([A-Z])'), (m) => '${m[1]}-${m[2]}')
        .toLowerCase()
        .replaceAll(RegExp(r'\s+'), '-');
    // Pluralize: add 's' unless already ends with 's'
    final plural = kebab.endsWith('s') ? kebab : '${kebab}s';
    return '/$plural';
  }

  String _formatHeader(String col) {
    return col
        .replaceAll('_', ' ')
        .split(' ')
        .map((w) => w.isNotEmpty
            ? '${w[0].toUpperCase()}${w.substring(1)}'
            : '')
        .join(' ');
  }

  String _formatCellValue(dynamic value) {
    if (value == null) return '—';
    if (value is List) return value.join(', ');
    if (value is Map) return value.values.join(', ');
    return value.toString();
  }
}
