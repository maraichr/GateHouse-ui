import 'package:flutter/material.dart';
import '../../models/component_tree.dart';
import '../../utils/design_tokens.dart';

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
    final tokens = context.tokens;
    return ListView(
      padding: EdgeInsets.symmetric(vertical: tokens.spaceXs),
      children: children,
    );
  }
}
