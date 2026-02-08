import 'package:flutter/material.dart';
import '../../models/component_tree.dart';
import '../../utils/icon_mapper.dart';

class NavGroupWidget extends StatelessWidget {
  final ComponentNode node;
  final List<Widget> children;

  const NavGroupWidget({
    super.key,
    required this.node,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    final label = node.stringProp('label') ?? '';
    final iconName = node.stringProp('icon');

    return ExpansionTile(
      leading: Icon(mapIcon(iconName), size: 20, color: Colors.grey.shade600),
      title: Text(
        label,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
      ),
      childrenPadding: const EdgeInsets.only(left: 16),
      initiallyExpanded: true,
      children: children,
    );
  }
}
