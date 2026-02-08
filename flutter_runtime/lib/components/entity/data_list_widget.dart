import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../models/component_tree.dart';
import '../../models/types.dart';
import '../display/field_display.dart';

/// Card-based list for Flutter (Flutter-specific presentation).
/// Used instead of DataTable for a mobile-friendly card layout.
class DataListWidget extends StatelessWidget {
  final ComponentNode node;
  final List<Map<String, dynamic>>? records;
  final List<ListColumn>? columns;
  final List<Field>? fields;
  final String? entityRoute;

  const DataListWidget({
    super.key,
    required this.node,
    this.records,
    this.columns,
    this.fields,
    this.entityRoute,
  });

  @override
  Widget build(BuildContext context) {
    final data = records ?? [];
    final cols = columns ??
        (node.listProp('columns') ?? [])
            .map(
                (c) => ListColumn.fromJson(Map<String, dynamic>.from(c as Map)))
            .toList();
    final fieldList = fields ??
        (node.listProp('fields') ?? [])
            .map((f) => Field.fromJson(Map<String, dynamic>.from(f as Map)))
            .toList();
    final fieldMap = {for (final f in fieldList) f.name: f};
    final route = entityRoute ?? '';

    if (data.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text('No records', style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ),
      );
    }

    return ListView.builder(
      itemCount: data.length,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemBuilder: (context, index) {
        final record = data[index];
        return _RecordCard(
          record: record,
          columns: cols,
          fieldMap: fieldMap,
          entityRoute: route,
        );
      },
    );
  }
}

class _RecordCard extends StatelessWidget {
  final Map<String, dynamic> record;
  final List<ListColumn> columns;
  final Map<String, Field> fieldMap;
  final String entityRoute;

  const _RecordCard({
    required this.record,
    required this.columns,
    required this.fieldMap,
    required this.entityRoute,
  });

  @override
  Widget build(BuildContext context) {
    // Find the link column (title) and other display columns
    ListColumn? titleCol;
    final displayCols = <ListColumn>[];
    for (final col in columns) {
      if (col.isDetailLink && titleCol == null) {
        titleCol = col;
      } else {
        displayCols.add(col);
      }
    }

    final titleValue = titleCol != null
        ? record[titleCol.field]?.toString() ?? ''
        : record.values.first?.toString() ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          final id = record['id']?.toString();
          if (id != null && entityRoute.isNotEmpty) {
            context.go('$entityRoute/$id');
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title row
              Row(
                children: [
                  // Avatar if first column is image
                  if (columns.isNotEmpty &&
                      fieldMap[columns.first.field]?.type == 'image') ...[
                    _buildAvatar(context, record[columns.first.field]),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: Text(
                      titleValue,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ),
                  // Status badge if there's an enum column
                  ..._buildStatusBadge(context, displayCols),
                ],
              ),
              if (displayCols.isNotEmpty) ...[
                const SizedBox(height: 12),
                // Secondary fields in a wrap
                Wrap(
                  spacing: 16,
                  runSpacing: 8,
                  children: displayCols
                      .where((col) =>
                          fieldMap[col.field]?.type != 'enum' &&
                          fieldMap[col.field]?.type != 'image')
                      .take(4) // Show max 4 secondary fields
                      .map((col) {
                    final field = fieldMap[col.field];
                    if (field == null) return const SizedBox.shrink();
                    return _FieldChip(
                      label: field.displayName ?? field.name,
                      child: FieldDisplay(
                        field: field,
                        value: record[col.field],
                        compact: true,
                      ),
                    );
                  }).toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar(BuildContext context, dynamic src) {
    if (src is String && src.isNotEmpty) {
      return CircleAvatar(
        radius: 20,
        backgroundImage: NetworkImage(src),
      );
    }
    return CircleAvatar(
      radius: 20,
      backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Icon(Icons.business, color: Theme.of(context).colorScheme.onSurfaceVariant),
    );
  }

  List<Widget> _buildStatusBadge(
      BuildContext context, List<ListColumn> cols) {
    for (final col in cols) {
      final field = fieldMap[col.field];
      if (field?.type == 'enum' && field?.values != null) {
        return [
          FieldDisplay(
            field: field!,
            value: record[col.field],
            compact: true,
          ),
        ];
      }
    }
    return [];
  }
}

class _FieldChip extends StatelessWidget {
  final String label;
  final Widget child;

  const _FieldChip({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
        const SizedBox(height: 2),
        child,
      ],
    );
  }
}
