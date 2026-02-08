import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/component_tree.dart';

class SearchBarWidget extends StatefulWidget {
  final ComponentNode node;
  final String value;
  final ValueChanged<String> onChanged;

  const SearchBarWidget({
    super.key,
    required this.node,
    required this.value,
    required this.onChanged,
  });

  @override
  State<SearchBarWidget> createState() => _SearchBarWidgetState();
}

class _SearchBarWidgetState extends State<SearchBarWidget> {
  late final TextEditingController _controller;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.value);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final config = widget.node.mapProp('config') ?? {};
    final placeholder =
        config['placeholder'] as String? ?? 'Search...';
    final debounceMs = config['debounce_ms'] as int? ?? 300;

    return TextField(
      controller: _controller,
      decoration: InputDecoration(
        hintText: placeholder,
        prefixIcon: const Icon(Icons.search, size: 20),
        suffixIcon: _controller.text.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.clear, size: 18),
                onPressed: () {
                  _controller.clear();
                  widget.onChanged('');
                },
              )
            : null,
        isDense: true,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
      onChanged: (value) {
        _debounce?.cancel();
        _debounce = Timer(Duration(milliseconds: debounceMs), () {
          widget.onChanged(value);
        });
      },
    );
  }
}
