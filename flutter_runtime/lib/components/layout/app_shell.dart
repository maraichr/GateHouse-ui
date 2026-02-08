import 'package:flutter/material.dart';
import '../../models/component_tree.dart';

class AppShellWidget extends StatelessWidget {
  final ComponentNode node;
  final List<Widget> children;

  const AppShellWidget({
    super.key,
    required this.node,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    // AppShell is a container; actual rendering is done by the app.dart scaffold
    // Children are sidebar + routed content
    return Column(
      children: children,
    );
  }
}
