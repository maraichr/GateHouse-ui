import 'package:flutter/material.dart';
import '../../models/component_tree.dart';

class SidebarWidget extends StatelessWidget {
  final ComponentNode node;
  final List<Widget> children;

  const SidebarWidget({
    super.key,
    required this.node,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: children,
    );
  }
}
