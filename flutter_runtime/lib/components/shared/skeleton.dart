import 'package:flutter/material.dart';

/// Base shimmer skeleton widget with configurable variant.
class SkeletonWidget extends StatefulWidget {
  final SkeletonVariant variant;
  final double? width;
  final double? height;

  const SkeletonWidget({
    super.key,
    this.variant = SkeletonVariant.text,
    this.width,
    this.height,
  });

  @override
  State<SkeletonWidget> createState() => _SkeletonWidgetState();
}

enum SkeletonVariant { text, circular, rectangular }

class _SkeletonWidgetState extends State<SkeletonWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor =
        isDark ? Colors.grey.shade800 : Colors.grey.shade200;
    final highlightColor =
        isDark ? Colors.grey.shade700 : Colors.grey.shade100;

    final borderRadius = widget.variant == SkeletonVariant.circular
        ? BorderRadius.circular(999)
        : BorderRadius.circular(
            widget.variant == SkeletonVariant.rectangular ? 8 : 4);

    final w = widget.width ??
        (widget.variant == SkeletonVariant.circular
            ? 40.0
            : double.infinity);
    final h = widget.height ??
        (widget.variant == SkeletonVariant.circular
            ? 40.0
            : widget.variant == SkeletonVariant.text
                ? 16.0
                : 100.0);

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: w,
          height: h,
          decoration: BoxDecoration(
            borderRadius: borderRadius,
            gradient: LinearGradient(
              begin: Alignment(-1.0 + 2.0 * _controller.value, 0),
              end: Alignment(
                  -1.0 + 2.0 * _controller.value + 1.0, 0),
              colors: [baseColor, highlightColor, baseColor],
              stops: const [0.0, 0.5, 1.0],
            ),
          ),
        );
      },
    );
  }
}

/// Table skeleton with shimmer bars.
class TableSkeleton extends StatelessWidget {
  final int rows;
  final int cols;

  const TableSkeleton({super.key, this.rows = 5, this.cols = 4});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Header row
        Container(
          padding: const EdgeInsets.all(12),
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          child: Row(
            children: List.generate(
              cols,
              (i) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: SkeletonWidget(
                      width: double.infinity, height: 12),
                ),
              ),
            ),
          ),
        ),
        // Data rows
        ...List.generate(
          rows,
          (r) => Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: Theme.of(context).dividerColor,
                  width: 0.5,
                ),
              ),
            ),
            child: Row(
              children: List.generate(
                cols,
                (c) => Expanded(
                  child: Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 4),
                    child: SkeletonWidget(height: 14),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Detail header + tabs + content skeleton.
class DetailSkeleton extends StatelessWidget {
  const DetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const SkeletonWidget(
                variant: SkeletonVariant.circular,
                width: 64,
                height: 64,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    SkeletonWidget(width: 200, height: 20),
                    SizedBox(height: 8),
                    SkeletonWidget(width: 140, height: 14),
                  ],
                ),
              ),
            ],
          ),
        ),
        const Divider(height: 1),
        // Tab bar
        Padding(
          padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: const [
              SkeletonWidget(width: 60, height: 14),
              SizedBox(width: 24),
              SkeletonWidget(width: 80, height: 14),
              SizedBox(width: 24),
              SkeletonWidget(width: 70, height: 14),
            ],
          ),
        ),
        const Divider(height: 1),
        // Content grid
        Padding(
          padding: const EdgeInsets.all(16),
          child: Wrap(
            spacing: 24,
            runSpacing: 16,
            children: List.generate(
              4,
              (i) => SizedBox(
                width: 200,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    SkeletonWidget(width: 80, height: 12),
                    SizedBox(height: 8),
                    SkeletonWidget(width: 140, height: 16),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Stat cards skeleton.
class StatCardsSkeleton extends StatelessWidget {
  final int count;

  const StatCardsSkeleton({super.key, this.count = 4});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 16,
      runSpacing: 16,
      children: List.generate(
        count,
        (i) => SizedBox(
          width: 160,
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  SkeletonWidget(width: 100, height: 12),
                  SizedBox(height: 8),
                  SkeletonWidget(width: 60, height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
