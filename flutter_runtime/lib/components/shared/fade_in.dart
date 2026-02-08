import 'package:flutter/material.dart';
import '../../utils/design_tokens.dart';

/// Wraps [child] in a fade-in animation.
/// Duration respects [GHTokens.motionNormal] (motion_mode: none = 0ms).
class FadeIn extends StatefulWidget {
  final Widget child;
  final Duration? duration;

  const FadeIn({super.key, required this.child, this.duration});

  @override
  State<FadeIn> createState() => _FadeInState();
}

class _FadeInState extends State<FadeIn>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration ?? const Duration(milliseconds: 200),
    );
    _opacity =
        CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    _controller.forward();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Update duration from design tokens if available and no explicit
    // duration was provided.
    final tokens = Theme.of(context).extension<GHTokens>();
    if (tokens != null && widget.duration == null) {
      _controller.duration = tokens.motionNormal;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: widget.child,
    );
  }
}
