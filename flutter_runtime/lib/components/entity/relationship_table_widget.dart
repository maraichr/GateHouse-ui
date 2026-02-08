import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../../api/api_client.dart';
import '../../utils/config.dart';
import '../../utils/entity_to_resource.dart';
import '../../utils/string_utils.dart';

class RelationshipTableWidget extends StatefulWidget {
  final Map<String, dynamic> relationship;
  final String parentId;
  final List<String>? columns;

  const RelationshipTableWidget({
    super.key,
    required this.relationship,
    required this.parentId,
    this.columns,
  });

  @override
  State<RelationshipTableWidget> createState() =>
      _RelationshipTableWidgetState();
}

class _RelationshipTableWidgetState extends State<RelationshipTableWidget> {
  final ApiClient _api = ApiClient(baseUrl: AppConfig.apiBaseUrl);
  List<Map<String, dynamic>> _records = [];
  bool _loading = true;
  bool _error = false;

  @override
  void initState() {
    super.initState();
    _fetchRelated();
  }

  Future<void> _fetchRelated() async {
    setState(() {
      _loading = true;
      _error = false;
    });

    try {
      final entityName = widget.relationship['entity'] as String? ?? '';
      final foreignKey = widget.relationship['foreign_key'] as String? ?? '';
      final apiResource = '/${entityToResource(entityName)}';

      final filters = foreignKey.isNotEmpty
          ? {foreignKey: widget.parentId}
          : <String, dynamic>{};

      final result = await _api.getList(
        apiResource,
        filters: filters.isNotEmpty ? filters : null,
      );

      setState(() {
        _records = result.data;
        _loading = false;
      });
    } catch (e) {
      if (kDebugMode) debugPrint('[RelationshipTable] Error: $e');
      setState(() {
        _loading = false;
        _error = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text(
            'Unable to load related data',
            style: TextStyle(color: Theme.of(context).colorScheme.outline),
          ),
        ),
      );
    }

    final displayName = widget.relationship['display_name'] as String? ??
        widget.relationship['name'] as String? ??
        'records';

    if (_records.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text(
            'No $displayName found',
            style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ),
      );
    }

    // Determine display columns
    final displayCols = (widget.columns != null && widget.columns!.isNotEmpty)
        ? widget.columns!
        : _records.first.keys
            .where((k) => k != 'id' && !k.endsWith('_id'))
            .toList();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowColor: WidgetStateProperty.all(Theme.of(context).colorScheme.surfaceContainerLow),
        columns: displayCols
            .map((col) => DataColumn(
                  label: Text(
                    humanize(col),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ))
            .toList(),
        rows: _records.map((rec) {
          return DataRow(
            cells: displayCols.map((col) {
              return DataCell(
                Text(
                  _formatValue(rec[col]),
                  style: const TextStyle(fontSize: 13),
                ),
              );
            }).toList(),
          );
        }).toList(),
      ),
    );
  }

  String _formatValue(dynamic val) {
    if (val == null) return '\u2014';
    if (val is Map || val is List) return val.toString();
    return val.toString();
  }
}
