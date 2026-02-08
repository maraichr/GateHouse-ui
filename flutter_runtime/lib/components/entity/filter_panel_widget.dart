import 'package:flutter/material.dart';
import '../../models/component_tree.dart';
import '../../models/types.dart';
import '../../utils/design_tokens.dart';
import '../../utils/icon_mapper.dart';

class FilterPanelWidget extends StatefulWidget {
  final ComponentNode node;
  final Map<String, dynamic> activeFilters;
  final ValueChanged<Map<String, dynamic>> onFiltersChanged;

  const FilterPanelWidget({
    super.key,
    required this.node,
    required this.activeFilters,
    required this.onFiltersChanged,
  });

  @override
  State<FilterPanelWidget> createState() => _FilterPanelWidgetState();
}

class _FilterPanelWidgetState extends State<FilterPanelWidget> {
  late Map<String, dynamic> _localFilters;

  @override
  void initState() {
    super.initState();
    _localFilters = Map.from(widget.activeFilters);
  }

  @override
  void didUpdateWidget(FilterPanelWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeFilters != widget.activeFilters) {
      _localFilters = Map.from(widget.activeFilters);
    }
  }

  void _updateFilter(String key, dynamic value) {
    setState(() {
      if (value == null || (value is String && value.isEmpty) ||
          (value is List && value.isEmpty)) {
        _localFilters.remove(key);
      } else {
        _localFilters[key] = value;
      }
    });
    widget.onFiltersChanged(Map.from(_localFilters));
  }

  @override
  Widget build(BuildContext context) {
    // Filter config is at props.config (with groups[].fields), entity fields at props.fields
    final config = widget.node.mapProp('config');
    final groups = (config?['groups'] as List?) ?? [];
    final fields = (widget.node.listProp('fields') ?? [])
        .map((f) => Field.fromJson(Map<String, dynamic>.from(f as Map)))
        .toList();
    final fieldMap = {for (final f in fields) f.name: f};

    if (groups.isEmpty) return const SizedBox.shrink();

    final widgets = <Widget>[];
    for (final groupDef in groups) {
      final group = Map<String, dynamic>.from(groupDef as Map);
      final groupLabel = group['label'] as String?;
      final groupFields = (group['fields'] as List?) ?? [];

      if (groupLabel != null) {
        final tokens = context.tokens;
        widgets.add(Padding(
          padding: EdgeInsets.only(bottom: tokens.spaceXs, top: tokens.spaceXs / 2),
          child: Text(
            groupLabel.toUpperCase(),
            style: TextStyle(
              fontSize: tokens.fontXs,
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              letterSpacing: 0.5,
            ),
          ),
        ));
      }

      for (final filterDef in groupFields) {
        final filter = Map<String, dynamic>.from(filterDef as Map);
        final fieldName = filter['field'] as String? ?? '';
        final filterType = filter['type'] as String? ?? 'select';
        final label = filter['label'] as String? ??
            fieldMap[fieldName]?.displayName ??
            fieldName.replaceAll('_', ' ');
        final field = fieldMap[fieldName];

        widgets.add(Padding(
          padding: EdgeInsets.only(bottom: context.tokens.spaceMd),
          child: _buildFilterControl(
            filterType,
            fieldName,
            label,
            filter,
            field,
          ),
        ));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }

  Widget _buildFilterControl(
    String type,
    String fieldName,
    String label,
    Map<String, dynamic> filterConfig,
    Field? field,
  ) {
    switch (type) {
      case 'checkbox_group':
        return _CheckboxGroupFilter(
          label: label,
          fieldName: fieldName,
          options: _getOptions(filterConfig, field),
          selected: _localFilters[fieldName],
          onChanged: (val) => _updateFilter(fieldName, val),
        );

      case 'select':
        return _SelectFilter(
          label: label,
          fieldName: fieldName,
          options: _getOptions(filterConfig, field),
          value: _localFilters[fieldName]?.toString(),
          onChanged: (val) => _updateFilter(fieldName, val),
        );

      case 'multi_select':
        return _MultiSelectFilter(
          label: label,
          fieldName: fieldName,
          options: _getOptions(filterConfig, field),
          selected: _localFilters[fieldName] is List
              ? List<String>.from(_localFilters[fieldName] as List)
              : <String>[],
          onChanged: (val) => _updateFilter(fieldName, val),
        );

      case 'date_range':
        return _DateRangeFilter(
          label: label,
          fieldName: fieldName,
          value: _localFilters[fieldName] as Map<String, dynamic>?,
          onChanged: (val) => _updateFilter(fieldName, val),
        );

      case 'numeric_range':
        return _NumericRangeFilter(
          label: label,
          fieldName: fieldName,
          value: _localFilters[fieldName] as Map<String, dynamic>?,
          onChanged: (val) => _updateFilter(fieldName, val),
        );

      case 'range_slider':
        return _RangeSliderFilter(
          label: label,
          fieldName: fieldName,
          value: _localFilters[fieldName] as Map<String, dynamic>?,
          onChanged: (val) => _updateFilter(fieldName, val),
          min: (filterConfig['min'] as num?)?.toDouble() ?? 0,
          max: (filterConfig['max'] as num?)?.toDouble() ?? 5,
          step: (filterConfig['step'] as num?)?.toDouble() ?? 0.5,
        );

      default:
        return _SelectFilter(
          label: label,
          fieldName: fieldName,
          options: _getOptions(filterConfig, field),
          value: _localFilters[fieldName]?.toString(),
          onChanged: (val) => _updateFilter(fieldName, val),
        );
    }
  }

  List<_FilterOption> _getOptions(
      Map<String, dynamic> filterConfig, Field? field) {
    // Check for explicit options in filter config
    final configOptions = filterConfig['options'] as List?;
    if (configOptions != null) {
      return configOptions.map((o) {
        if (o is Map) {
          return _FilterOption(
            value: (o['value'] ?? '').toString(),
            label: (o['label'] ?? o['value'] ?? '').toString(),
          );
        }
        return _FilterOption(value: o.toString(), label: o.toString());
      }).toList();
    }

    // Fall back to field enum values
    if (field?.values != null) {
      return field!.values!
          .map((v) => _FilterOption(value: v.value, label: v.label))
          .toList();
    }

    return [];
  }
}

class _FilterOption {
  final String value;
  final String label;
  const _FilterOption({required this.value, required this.label});
}

class _CheckboxGroupFilter extends StatelessWidget {
  final String label;
  final String fieldName;
  final List<_FilterOption> options;
  final dynamic selected;
  final ValueChanged<List<String>?> onChanged;

  const _CheckboxGroupFilter({
    required this.label,
    required this.fieldName,
    required this.options,
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final selectedList = selected is List
        ? List<String>.from(selected as List)
        : <String>[];

    final tokens = context.tokens;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: TextStyle(fontSize: tokens.fontSm, fontWeight: FontWeight.w500)),
        SizedBox(height: tokens.spaceXs / 2),
        ...options.map((opt) {
          return SizedBox(
            height: 36,
            child: CheckboxListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: Text(opt.label, style: TextStyle(fontSize: tokens.fontSm)),
              value: selectedList.contains(opt.value),
              onChanged: (checked) {
                final newList = List<String>.from(selectedList);
                if (checked == true) {
                  newList.add(opt.value);
                } else {
                  newList.remove(opt.value);
                }
                onChanged(newList.isEmpty ? null : newList);
              },
            ),
          );
        }),
      ],
    );
  }
}

class _SelectFilter extends StatelessWidget {
  final String label;
  final String fieldName;
  final List<_FilterOption> options;
  final String? value;
  final ValueChanged<String?> onChanged;

  const _SelectFilter({
    required this.label,
    required this.fieldName,
    required this.options,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: TextStyle(fontSize: tokens.fontSm, fontWeight: FontWeight.w500)),
        SizedBox(height: tokens.spaceXs / 2),
        DropdownButtonFormField<String>(
          value: value,
          isExpanded: true,
          decoration: InputDecoration(
            isDense: true,
            contentPadding: EdgeInsets.symmetric(horizontal: tokens.spaceSm, vertical: tokens.spaceXs),
            border: const OutlineInputBorder(),
          ),
          hint: Text('All', style: TextStyle(fontSize: tokens.fontSm)),
          items: [
            DropdownMenuItem<String>(
              value: null,
              child: Text('All', style: TextStyle(fontSize: tokens.fontSm)),
            ),
            ...options.map((opt) => DropdownMenuItem<String>(
                  value: opt.value,
                  child: Text(opt.label, style: TextStyle(fontSize: tokens.fontSm)),
                )),
          ],
          onChanged: onChanged,
        ),
      ],
    );
  }
}

class _MultiSelectFilter extends StatelessWidget {
  final String label;
  final String fieldName;
  final List<_FilterOption> options;
  final List<String> selected;
  final ValueChanged<List<String>?> onChanged;

  const _MultiSelectFilter({
    required this.label,
    required this.fieldName,
    required this.options,
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: TextStyle(fontSize: tokens.fontSm, fontWeight: FontWeight.w500)),
        SizedBox(height: tokens.spaceXs / 2),
        if (options.isEmpty)
          Text('No options available',
              style: TextStyle(fontSize: tokens.fontSm, color: Theme.of(context).colorScheme.outline))
        else
          Wrap(
            spacing: tokens.spaceXs * 0.75,
            runSpacing: tokens.spaceXs / 2,
            children: options.map((opt) {
              final isSelected = selected.contains(opt.value);
              return FilterChip(
                selected: isSelected,
                label: Text(opt.label, style: TextStyle(fontSize: tokens.fontSm)),
                onSelected: (val) {
                  final newList = List<String>.from(selected);
                  if (val) {
                    newList.add(opt.value);
                  } else {
                    newList.remove(opt.value);
                  }
                  onChanged(newList.isEmpty ? null : newList);
                },
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
              );
            }).toList(),
          ),
      ],
    );
  }
}

class _DateRangeFilter extends StatelessWidget {
  final String label;
  final String fieldName;
  final Map<String, dynamic>? value;
  final ValueChanged<Map<String, dynamic>?> onChanged;

  const _DateRangeFilter({
    required this.label,
    required this.fieldName,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final from = value?['from'] as String?;
    final to = value?['to'] as String?;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: TextStyle(fontSize: tokens.fontSm, fontWeight: FontWeight.w500)),
        SizedBox(height: tokens.spaceXs / 2),
        OutlinedButton.icon(
          onPressed: () async {
            final range = await showDateRangePicker(
              context: context,
              firstDate: DateTime(2020),
              lastDate: DateTime(2030),
              initialDateRange: from != null && to != null
                  ? DateTimeRange(
                      start: DateTime.parse(from),
                      end: DateTime.parse(to),
                    )
                  : null,
            );
            if (range != null) {
              onChanged({
                'from': range.start.toIso8601String().split('T')[0],
                'to': range.end.toIso8601String().split('T')[0],
              });
            }
          },
          icon: Icon(mapIcon('calendar'), size: 14),
          label: Text(
            from != null && to != null ? '$from \u2013 $to' : 'Select dates',
            style: TextStyle(fontSize: tokens.fontSm),
          ),
          style: OutlinedButton.styleFrom(
            padding: EdgeInsets.symmetric(horizontal: tokens.spaceSm, vertical: tokens.spaceXs * 0.75),
          ),
        ),
        if (from != null || to != null)
          TextButton(
            onPressed: () => onChanged(null),
            child:
                Text('Clear', style: TextStyle(fontSize: tokens.fontXs)),
          ),
      ],
    );
  }
}

class _NumericRangeFilter extends StatefulWidget {
  final String label;
  final String fieldName;
  final Map<String, dynamic>? value;
  final ValueChanged<Map<String, dynamic>?> onChanged;

  const _NumericRangeFilter({
    required this.label,
    required this.fieldName,
    required this.value,
    required this.onChanged,
  });

  @override
  State<_NumericRangeFilter> createState() => _NumericRangeFilterState();
}

class _NumericRangeFilterState extends State<_NumericRangeFilter> {
  late TextEditingController _minCtrl;
  late TextEditingController _maxCtrl;

  @override
  void initState() {
    super.initState();
    _minCtrl = TextEditingController(text: widget.value?['min']?.toString());
    _maxCtrl = TextEditingController(text: widget.value?['max']?.toString());
  }

  @override
  void dispose() {
    _minCtrl.dispose();
    _maxCtrl.dispose();
    super.dispose();
  }

  void _emitChange() {
    final min = _minCtrl.text.trim();
    final max = _maxCtrl.text.trim();
    if (min.isEmpty && max.isEmpty) {
      widget.onChanged(null);
    } else {
      final map = <String, dynamic>{};
      if (min.isNotEmpty) map['min'] = min;
      if (max.isNotEmpty) map['max'] = max;
      widget.onChanged(map);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label,
            style: TextStyle(fontSize: tokens.fontSm, fontWeight: FontWeight.w500)),
        SizedBox(height: tokens.spaceXs / 2),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _minCtrl,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  isDense: true,
                  hintText: 'Min',
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: tokens.spaceSm, vertical: tokens.spaceXs),
                  border: const OutlineInputBorder(),
                ),
                style: TextStyle(fontSize: tokens.fontSm),
                onChanged: (_) => _emitChange(),
              ),
            ),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: tokens.spaceXs),
              child: Text('\u2013', style: TextStyle(color: Theme.of(context).colorScheme.outline)),
            ),
            Expanded(
              child: TextFormField(
                controller: _maxCtrl,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  isDense: true,
                  hintText: 'Max',
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: tokens.spaceSm, vertical: tokens.spaceXs),
                  border: const OutlineInputBorder(),
                ),
                style: TextStyle(fontSize: tokens.fontSm),
                onChanged: (_) => _emitChange(),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _RangeSliderFilter extends StatefulWidget {
  final String label;
  final String fieldName;
  final Map<String, dynamic>? value;
  final ValueChanged<Map<String, dynamic>?> onChanged;
  final double min;
  final double max;
  final double step;

  const _RangeSliderFilter({
    required this.label,
    required this.fieldName,
    required this.value,
    required this.onChanged,
    required this.min,
    required this.max,
    required this.step,
  });

  @override
  State<_RangeSliderFilter> createState() => _RangeSliderFilterState();
}

class _RangeSliderFilterState extends State<_RangeSliderFilter> {
  late RangeValues _range;

  @override
  void initState() {
    super.initState();
    _range = RangeValues(
      (widget.value?['min'] as num?)?.toDouble() ?? widget.min,
      (widget.value?['max'] as num?)?.toDouble() ?? widget.max,
    );
  }

  @override
  void didUpdateWidget(_RangeSliderFilter oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      _range = RangeValues(
        (widget.value?['min'] as num?)?.toDouble() ?? widget.min,
        (widget.value?['max'] as num?)?.toDouble() ?? widget.max,
      );
    }
  }

  int get _divisions {
    final d = ((widget.max - widget.min) / widget.step).round();
    return d > 0 ? d : 1;
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label,
            style: TextStyle(fontSize: tokens.fontSm, fontWeight: FontWeight.w500)),
        SizedBox(height: tokens.spaceXs / 2),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(_range.start.toStringAsFixed(1),
                style: TextStyle(fontSize: tokens.fontSm, color: Theme.of(context).colorScheme.outline)),
            Text(_range.end.toStringAsFixed(1),
                style: TextStyle(fontSize: tokens.fontSm, color: Theme.of(context).colorScheme.outline)),
          ],
        ),
        RangeSlider(
          values: _range,
          min: widget.min,
          max: widget.max,
          divisions: _divisions,
          labels: RangeLabels(
            _range.start.toStringAsFixed(1),
            _range.end.toStringAsFixed(1),
          ),
          onChanged: (values) {
            setState(() => _range = values);
          },
          onChangeEnd: (values) {
            if (values.start <= widget.min && values.end >= widget.max) {
              widget.onChanged(null);
            } else {
              widget.onChanged({
                'min': values.start,
                'max': values.end,
              });
            }
          },
        ),
        if (widget.value != null)
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {
                setState(() => _range = RangeValues(widget.min, widget.max));
                widget.onChanged(null);
              },
              child: Text('Clear', style: TextStyle(fontSize: tokens.fontXs)),
            ),
          ),
      ],
    );
  }
}
