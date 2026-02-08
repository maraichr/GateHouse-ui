import 'package:flutter/material.dart';
import 'package:collection/collection.dart';

class FilterPresetsWidget extends StatelessWidget {
  final List<dynamic> presets;
  final Map<String, dynamic> activeFilters;
  final ValueChanged<Map<String, dynamic>> onPresetSelected;

  const FilterPresetsWidget({
    super.key,
    required this.presets,
    required this.activeFilters,
    required this.onPresetSelected,
  });

  @override
  Widget build(BuildContext context) {
    if (presets.isEmpty) return const SizedBox.shrink();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: presets.map((preset) {
          final p = preset as Map<String, dynamic>;
          final label = p['label'] as String? ?? '';
          final filters = Map<String, dynamic>.from(
              p['filters'] as Map? ?? {});
          final isActive =
              const DeepCollectionEquality().equals(filters, activeFilters);

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              selected: isActive,
              label: Text(label, style: const TextStyle(fontSize: 12)),
              onSelected: (_) {
                if (isActive) {
                  onPresetSelected({});
                } else {
                  onPresetSelected(filters);
                }
              },
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              visualDensity: VisualDensity.compact,
            ),
          );
        }).toList(),
      ),
    );
  }
}
