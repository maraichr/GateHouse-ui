import 'package:flutter/material.dart';
import '../../models/component_tree.dart';
import '../../utils/design_tokens.dart';
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
    final tokens = context.tokens;
    final label = node.stringProp('label') ?? '';
    final iconName = node.stringProp('icon');

    return ExpansionTile(
      leading: Icon(mapIcon(iconName), size: 20, color: Theme.of(context).colorScheme.onSurfaceVariant),
      title: Text(
        label,
        style: TextStyle(fontSize: tokens.fontBase, fontWeight: FontWeight.w500),
      ),
      childrenPadding: EdgeInsets.only(left: tokens.spaceMd),
      initiallyExpanded: true,
      children: children,
    );
  }
}
