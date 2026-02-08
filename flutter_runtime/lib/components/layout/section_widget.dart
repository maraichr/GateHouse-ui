import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/component_tree.dart';
import '../../models/types.dart';
import '../display/field_display.dart';

/// Section widget renders a group of fields from the entity detail record.
/// Record and fields are injected by EntityDetail into the node props.
class SectionWidget extends ConsumerWidget {
  final ComponentNode node;

  const SectionWidget({super.key, required this.node});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final title = node.stringProp('title') ?? '';
    final layout = node.stringProp('layout') ?? 'single_column';
    final fieldNames =
        (node.listProp('fields') ?? []).map((e) => e.toString()).toList();
    final record =
        node.props?['_record'] as Map<String, dynamic>? ?? {};
    final rawFields = node.props?['_fields'];
    final allFields = (rawFields is List)
        ? rawFields
            .map((e) => Field.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList()
        : <Field>[];

    final fieldMap = {for (final f in allFields) f.name: f};
    final visibleFields = fieldNames
        .where((name) => fieldMap.containsKey(name))
        .map((name) => fieldMap[name]!)
        .toList();

    if (visibleFields.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title.isNotEmpty) ...[
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 12),
          ],
          if (layout == 'two_column')
            _buildTwoColumn(context, visibleFields, record)
          else
            _buildSingleColumn(context, visibleFields, record),
        ],
      ),
    );
  }

  Widget _buildTwoColumn(
      BuildContext context, List<Field> fields, Map<String, dynamic> record) {
    final rows = <Widget>[];
    for (var i = 0; i < fields.length; i += 2) {
      rows.add(Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
              child: _fieldDisplay(context, fields[i], record)),
          const SizedBox(width: 16),
          if (i + 1 < fields.length)
            Expanded(
                child: _fieldDisplay(context, fields[i + 1], record))
          else
            const Expanded(child: SizedBox.shrink()),
        ],
      ));
      if (i + 2 < fields.length) rows.add(const SizedBox(height: 12));
    }
    return Column(children: rows);
  }

  Widget _buildSingleColumn(
      BuildContext context, List<Field> fields, Map<String, dynamic> record) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: fields
          .map((f) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _fieldDisplay(context, f, record),
              ))
          .toList(),
    );
  }

  Widget _fieldDisplay(
      BuildContext context, Field field, Map<String, dynamic> record) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          field.displayName ?? field.name,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
        ),
        const SizedBox(height: 4),
        FieldDisplay(field: field, value: record[field.name]),
      ],
    );
  }
}
