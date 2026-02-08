import 'package:flutter/material.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:go_router/go_router.dart';
import '../../api/api_client.dart';
import '../../models/component_tree.dart';
import '../../models/types.dart';
import '../../utils/config.dart';
import '../../utils/design_tokens.dart';
import '../../utils/template_expression.dart';
import 'fields/form_field_builder.dart';

/// Dynamic form for create and edit modes.
class DynamicFormWidget extends StatefulWidget {
  final ComponentNode node;
  final List<ComponentNode> childNodes;

  const DynamicFormWidget({
    super.key,
    required this.node,
    required this.childNodes,
  });

  @override
  State<DynamicFormWidget> createState() => _DynamicFormWidgetState();
}

class _DynamicFormWidgetState extends State<DynamicFormWidget> {
  final _formKey = GlobalKey<FormBuilderState>();
  final ApiClient _api = ApiClient(baseUrl: AppConfig.apiBaseUrl);
  bool _loading = false;
  bool _fetchingRecord = false;
  Map<String, dynamic>? _existingRecord;
  bool _hasFetched = false;

  bool get isEdit => widget.node.stringProp('mode') == 'edit';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_hasFetched && isEdit) {
      _hasFetched = true;
      _fetchRecord();
    }
  }

  Future<void> _fetchRecord() async {
    setState(() => _fetchingRecord = true);
    try {
      final resource = widget.node.stringProp('api_resource') ?? '';
      final id = GoRouterState.of(context).pathParameters['id'] ?? '';
      if (resource.isNotEmpty && id.isNotEmpty) {
        _existingRecord = await _api.getDetail(resource, id);
      }
    } catch (_) {}
    setState(() => _fetchingRecord = false);
  }

  List<Field> _getFormFields() {
    // Collect fields from child form_section/form_step nodes
    final allFields = <String>[];
    for (final child in widget.childNodes) {
      if (child.kind == 'form_step' || child.kind == 'form_section') {
        final fieldNames = (child.listProp('fields') ?? [])
            .map((f) => f.toString())
            .toList();
        allFields.addAll(fieldNames);
      }
    }

    // Get entity field definitions
    final entityFields = (widget.node.listProp('fields') ?? [])
        .map((f) => Field.fromJson(Map<String, dynamic>.from(f as Map)))
        .toList();
    final fieldMap = {for (final f in entityFields) f.name: f};

    // Filter to only form fields (from show_in or explicitly listed)
    if (allFields.isNotEmpty) {
      return allFields
          .where((name) => fieldMap.containsKey(name))
          .map((name) => fieldMap[name]!)
          .toList();
    }

    // Fallback: use show_in to determine fields
    final context = isEdit ? 'edit' : 'create';
    return entityFields
        .where((f) =>
            !f.hidden &&
            !f.primaryKey &&
            f.shownIn(context))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_fetchingRecord) {
      return const Center(child: CircularProgressIndicator());
    }

    final fields = _getFormFields();
    final title = widget.node.stringProp('title') ??
        (widget.node.stringProp('title_tpl') != null && _existingRecord != null
            ? evaluateTemplate(
                widget.node.stringProp('title_tpl')!, _existingRecord!)
            : (isEdit ? 'Edit' : 'Create'));
    final submitLabel =
        widget.node.stringProp('submit_label') ?? (isEdit ? 'Save' : 'Create');
    final cancelPath = widget.node.stringProp('cancel_path');
    final overrides =
        widget.node.mapProp('field_overrides') ?? {};

    final tokens = context.tokens;
    return SingleChildScrollView(
      padding: EdgeInsets.all(tokens.spaceLg),
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
          SizedBox(height: tokens.spaceLg),
          FormBuilder(
            key: _formKey,
            initialValue: _existingRecord ?? {},
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ...fields.map((field) {
                  final fieldOverride =
                      overrides[field.name] as Map<String, dynamic>?;
                  final isDisabled =
                      isEdit && field.immutable;

                  return Padding(
                    padding: EdgeInsets.only(bottom: tokens.spaceMd),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (fieldOverride?['highlight'] == true)
                          Container(
                            padding: EdgeInsets.all(tokens.spaceXs),
                            margin: EdgeInsets.only(bottom: tokens.spaceXs),
                            decoration: BoxDecoration(
                              color: tokens.warning[50]!,
                              borderRadius: BorderRadius.circular(tokens.radiusMd),
                              border: Border.all(color: tokens.warning[200]!),
                            ),
                            child: Text(
                              fieldOverride!['help_text'] as String? ?? '',
                              style: TextStyle(
                                fontSize: tokens.fontSm,
                                color: tokens.warning[800]!,
                              ),
                            ),
                          ),
                        buildFormField(
                          field: field,
                          enabled: !isDisabled,
                          initialValue: _existingRecord?[field.name],
                        ),
                      ],
                    ),
                  );
                }),
                SizedBox(height: tokens.spaceLg),
                Row(
                  children: [
                    FilledButton(
                      onPressed: _loading ? null : _handleSubmit,
                      child: _loading
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(submitLabel),
                    ),
                    SizedBox(width: tokens.spaceSm),
                    if (cancelPath != null)
                      OutlinedButton(
                        onPressed: () => context.go(cancelPath),
                        child: const Text('Cancel'),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (!(_formKey.currentState?.saveAndValidate() ?? false)) return;

    setState(() => _loading = true);
    final values = _formKey.currentState!.value;
    final resource = widget.node.stringProp('api_resource') ?? '';

    try {
      if (isEdit) {
        final id = GoRouterState.of(context).pathParameters['id'] ?? '';
        await _api.update(resource, id, values);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Saved successfully'),
              backgroundColor: context.tokens.success[600]!,
            ),
          );
          context.go('$resource/$id');
        }
      } else {
        final result = await _api.create(resource, values);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Created successfully'),
              backgroundColor: context.tokens.success[600]!,
            ),
          );
          final newId = result['id']?.toString();
          if (newId != null) {
            context.go('$resource/$newId');
          } else {
            context.go(resource);
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: context.tokens.danger[600]!,
          ),
        );
      }
    }
    setState(() => _loading = false);
  }
}
