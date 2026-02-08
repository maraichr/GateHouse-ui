import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/component_tree.dart';
import '../../models/types.dart';
import '../../providers/auth_provider.dart';
import '../../utils/template_expression.dart';
import '../../utils/theme_colors.dart';
import '../../utils/guard_evaluator.dart';
import '../../utils/icon_mapper.dart';
import '../../api/api_client.dart';
import '../../utils/config.dart';

class DetailHeaderWidget extends ConsumerWidget {
  final ComponentNode node;

  const DetailHeaderWidget({super.key, required this.node});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    try {
      return _buildContent(context, ref);
    } catch (e, stack) {
      if (kDebugMode) debugPrint('[DetailHeader] Error: $e');
      if (kDebugMode) debugPrint('[DetailHeader] Stack: $stack');
      return Card(
        margin: const EdgeInsets.all(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Text('DetailHeader error: $e', style: TextStyle(color: Theme.of(context).colorScheme.error)),
        ),
      );
    }
  }

  Widget _buildContent(BuildContext context, WidgetRef ref) {
    final permissions = ref.watch(permissionCheckerProvider);
    final config = node.mapProp('config') ?? {};
    final record =
        node.props?['_record'] as Map<String, dynamic>? ?? {};

    if (kDebugMode) debugPrint('[DetailHeader] _fields type: ${node.props?['_fields']?.runtimeType}');

    final rawFields = node.props?['_fields'];
    final fields = (rawFields is List)
        ? rawFields
            .map((e) => Field.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList()
        : <Field>[];
    final fieldMap = {for (final f in fields) f.name: f};

    // Title and subtitle
    final title = config['title'] != null
        ? evaluateTemplate(config['title'] as String, record)
        : '';
    final subtitle = config['subtitle'] != null
        ? evaluateTemplate(config['subtitle'] as String, record)
        : '';

    // Status — spec uses status_badge template like "{{record.status}}"
    // Extract the field name from the template, or fall back to status_field
    final statusBadge = config['status_badge'] as String?;
    final statusFieldName = config['status_field'] as String? ??
        (statusBadge != null
            ? RegExp(r'\{\{record\.(\w+)').firstMatch(statusBadge)?.group(1)
            : null);
    final statusValue =
        statusFieldName != null ? record[statusFieldName] : null;
    final statusField = statusFieldName != null ? fieldMap[statusFieldName] : null;

    // State machine for transitions
    final stateMachine = node.props?['state_machine'] as Map<String, dynamic>?;
    final rawTransitions = stateMachine?['transitions'];
    final transitions = (rawTransitions is List) ? rawTransitions : <dynamic>[];

    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: avatar + title + status
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar
                _buildAvatar(context, record, config),
                const SizedBox(width: 16),
                // Title + subtitle
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      if (subtitle.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          subtitle,
                          style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ],
                  ),
                ),
                // Status badge
                if (statusValue != null && statusField?.values != null)
                  _buildStatusBadge(context, statusValue, statusField!),
              ],
            ),

            // Stats row
            if (config['stats'] != null) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),
              Wrap(
                spacing: 24,
                runSpacing: 8,
                children: (config['stats'] as List<dynamic>).map((stat) {
                  final s = stat as Map<String, dynamic>;
                  final statPerms = s['permissions'] as List<dynamic>?;
                  if (!permissions.hasPermission(statPerms)) {
                    return const SizedBox.shrink();
                  }
                  String statValue;
                  final rawVal = s['value'];
                  if (rawVal is String) {
                    statValue = evaluateTemplate(rawVal, record);
                  } else if (rawVal is Map) {
                    // Computed stat from API — use field name to look up in record
                    final fieldName = rawVal['field'] as String?;
                    statValue = fieldName != null
                        ? record[fieldName]?.toString() ?? '–'
                        : '–';
                  } else {
                    statValue = rawVal?.toString() ?? '–';
                  }
                  return _StatChip(
                    label: s['label'] as String? ?? '',
                    value: statValue,
                    displayAs: s['display_as'] as String?,
                    format: s['format'] as String?,
                  );
                }).toList(),
              ),
            ],

            // Transition buttons
            if (transitions.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                children: transitions.map((t) {
                  final tr = Transition.fromJson(
                      Map<String, dynamic>.from(t as Map));
                  // Only show if current status is in `from` list
                  if (!tr.from.contains(statusValue?.toString())) {
                    return const SizedBox.shrink();
                  }
                  // Permission check
                  if (!permissions.hasPermission(tr.permissions)) {
                    return const SizedBox.shrink();
                  }
                  // Guard check
                  final guardResult = evaluateGuards(tr.guards, record);

                  final btnColor =
                      semanticColor(tr.color, colorScheme: colorScheme);

                  return Tooltip(
                    message:
                        guardResult.passed ? '' : guardResult.failMessage ?? '',
                    child: tr.color == 'danger'
                        ? OutlinedButton.icon(
                            onPressed: guardResult.passed
                                ? () =>
                                    _handleTransition(context, tr, record)
                                : null,
                            icon: Icon(mapIcon(tr.icon), size: 16),
                            label: Text(tr.label),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: btnColor,
                              side: BorderSide(color: btnColor),
                            ),
                          )
                        : FilledButton.icon(
                            onPressed: guardResult.passed
                                ? () =>
                                    _handleTransition(context, tr, record)
                                : null,
                            icon: Icon(mapIcon(tr.icon), size: 16),
                            label: Text(tr.label),
                            style: FilledButton.styleFrom(
                              backgroundColor: btnColor,
                            ),
                          ),
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar(
      BuildContext context, Map<String, dynamic> record, Map<String, dynamic> config) {
    final avatarExpr = config['avatar'] as String?;
    String? avatarUrl;
    if (avatarExpr != null) {
      avatarUrl = evaluateTemplate(avatarExpr, record);
    }

    if (avatarUrl != null && avatarUrl.isNotEmpty && !avatarUrl.contains('{{')) {
      return CircleAvatar(
        radius: 28,
        backgroundImage: NetworkImage(avatarUrl),
      );
    }
    // Initials fallback from record name/title
    final name = record['name'] ?? record['company_name'] ??
        record['title'] ?? record['display_name'];
    if (name != null && name.toString().isNotEmpty) {
      final words = name.toString().trim().split(RegExp(r'\s+'));
      final initials = words.length >= 2
          ? '${words[0][0]}${words[1][0]}'.toUpperCase()
          : words[0][0].toUpperCase();
      return CircleAvatar(
        radius: 28,
        backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
        child: Text(
          initials,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      );
    }
    final cs = Theme.of(context).colorScheme;
    return CircleAvatar(
      radius: 28,
      backgroundColor: cs.surfaceContainerHighest,
      child: Icon(Icons.business, size: 28, color: cs.onSurfaceVariant),
    );
  }

  Widget _buildStatusBadge(
      BuildContext context, dynamic value, Field field) {
    final enumVal = field.values?.firstWhere(
      (v) => v.value == value?.toString(),
      orElse: () => EnumValue(value: value.toString(), label: value.toString()),
    );
    if (enumVal == null) return const SizedBox.shrink();

    final color = semanticColor(
      enumVal.color,
      colorScheme: Theme.of(context).colorScheme,
    );

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (enumVal.icon != null) ...[
            Icon(mapIcon(enumVal.icon), size: 14, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            enumVal.label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleTransition(
      BuildContext context, Transition tr, Map<String, dynamic> record) async {
    final confirmed = await _showConfirmation(context, tr, record);
    if (!confirmed) return;

    try {
      final resource = node.props?['api_resource'] as String? ??
          node.scope?.entity ?? '';
      final id = record['id']?.toString() ?? '';
      await ApiClient(baseUrl: AppConfig.apiBaseUrl).transition(resource, id, tr.name);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${tr.label} completed'),
            backgroundColor: Theme.of(context).colorScheme.primary,
          ),
        );
        // Refresh by popping and re-navigating
        final currentPath = GoRouterState.of(context).uri.path;
        context.go(currentPath);
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  Future<bool> _showConfirmation(
      BuildContext context, Transition tr, Map<String, dynamic> record) async {
    final confirm = tr.confirmation;
    if (confirm == null) return true;

    final message = confirm['message'] != null
        ? evaluateTemplate(confirm['message'] as String, record)
        : 'Are you sure?';
    final title = confirm['title'] as String? ?? tr.label;
    final style = confirm['style'] as String?;
    final requireComment = confirm['require_comment'] as bool? ?? false;

    final commentController = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message),
            if (requireComment) ...[
              const SizedBox(height: 16),
              TextField(
                controller: commentController,
                decoration: InputDecoration(
                  labelText: confirm['comment_label'] as String? ?? 'Comment',
                  hintText: 'Enter reason...',
                ),
                maxLines: 3,
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (requireComment && commentController.text.trim().isEmpty) {
                return; // Don't close if comment required but empty
              }
              Navigator.of(context).pop(true);
            },
            style: FilledButton.styleFrom(
              backgroundColor: semanticColor(
                style,
                colorScheme: Theme.of(context).colorScheme,
              ),
            ),
            child: Text(tr.label),
          ),
        ],
      ),
    );

    commentController.dispose();
    return result ?? false;
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final String value;
  final String? displayAs;
  final String? format;

  const _StatChip({
    required this.label,
    required this.value,
    this.displayAs,
    this.format,
  });

  @override
  Widget build(BuildContext context) {
    Widget valueWidget;
    if (displayAs == 'star_rating') {
      final numVal = double.tryParse(value) ?? 0;
      valueWidget = Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(5, (i) {
          return Icon(
            i < numVal.round() ? Icons.star : Icons.star_border,
            size: 16,
            color: semanticColor('warning', colorScheme: Theme.of(context).colorScheme),
          );
        }),
      );
    } else {
      valueWidget = Text(
        format == 'currency' ? '\$$value' : value,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
        const SizedBox(height: 4),
        valueWidget,
      ],
    );
  }
}
