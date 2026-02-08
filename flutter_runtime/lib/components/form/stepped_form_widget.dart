import 'package:flutter/material.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:go_router/go_router.dart';
import '../../api/api_client.dart';
import '../../models/component_tree.dart';
import '../../models/types.dart';
import '../../utils/config.dart';
import '../../utils/design_tokens.dart';
import 'fields/form_field_builder.dart';

class SteppedFormWidget extends StatefulWidget {
  final ComponentNode node;
  final List<ComponentNode> childNodes;

  const SteppedFormWidget({
    super.key,
    required this.node,
    required this.childNodes,
  });

  @override
  State<SteppedFormWidget> createState() => _SteppedFormWidgetState();
}

class _SteppedFormWidgetState extends State<SteppedFormWidget> {
  final _formKey = GlobalKey<FormBuilderState>();
  final ApiClient _api = ApiClient(baseUrl: AppConfig.apiBaseUrl);
  int _currentStep = 0;
  bool _loading = false;

  List<_FormStep> _getSteps() {
    final entityFields = (widget.node.listProp('fields') ?? [])
        .map((f) => Field.fromJson(Map<String, dynamic>.from(f as Map)))
        .toList();
    final fieldMap = {for (final f in entityFields) f.name: f};

    return widget.childNodes
        .where((n) => n.kind == 'form_step')
        .map((step) {
      final fieldNames = (step.listProp('fields') ?? [])
          .map((f) => f.toString())
          .toList();
      final fields = fieldNames
          .where((name) => fieldMap.containsKey(name))
          .map((name) => fieldMap[name]!)
          .toList();
      return _FormStep(
        title: step.stringProp('title') ?? 'Step',
        description: step.stringProp('description'),
        fields: fields,
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final steps = _getSteps();
    final title = widget.node.stringProp('title') ?? 'Create';
    final submitLabel = widget.node.stringProp('submit_label') ?? 'Submit';
    final cancelPath = widget.node.stringProp('cancel_path');
    final overrides = widget.node.mapProp('field_overrides') ?? {};

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
            child: Stepper(
              currentStep: _currentStep,
              type: StepperType.vertical,
              onStepContinue: () {
                if (_currentStep < steps.length - 1) {
                  setState(() => _currentStep++);
                } else {
                  _handleSubmit();
                }
              },
              onStepCancel: () {
                if (_currentStep > 0) {
                  setState(() => _currentStep--);
                } else if (cancelPath != null) {
                  context.go(cancelPath);
                }
              },
              controlsBuilder: (context, details) {
                final isLast = _currentStep == steps.length - 1;
                return Padding(
                  padding: EdgeInsets.only(top: tokens.spaceMd),
                  child: Row(
                    children: [
                      FilledButton(
                        onPressed: _loading ? null : details.onStepContinue,
                        child: _loading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(isLast ? submitLabel : 'Continue'),
                      ),
                      SizedBox(width: tokens.spaceSm),
                      if (_currentStep > 0)
                        OutlinedButton(
                          onPressed: details.onStepCancel,
                          child: const Text('Back'),
                        ),
                    ],
                  ),
                );
              },
              steps: steps.asMap().entries.map((entry) {
                final i = entry.key;
                final step = entry.value;
                return Step(
                  title: Text(step.title),
                  subtitle:
                      step.description != null ? Text(step.description!) : null,
                  isActive: _currentStep >= i,
                  state: _currentStep > i
                      ? StepState.complete
                      : _currentStep == i
                          ? StepState.editing
                          : StepState.indexed,
                  content: Column(
                    children: step.fields.map((field) {
                      final fieldOverride =
                          overrides[field.name] as Map<String, dynamic>?;
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
                                  border: Border.all(
                                      color: tokens.warning[200]!),
                                ),
                                child: Text(
                                  fieldOverride!['help_text'] as String? ?? '',
                                  style: TextStyle(
                                    fontSize: tokens.fontSm,
                                    color: tokens.warning[800]!,
                                  ),
                                ),
                              ),
                            buildFormField(field: field),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                );
              }).toList(),
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

class _FormStep {
  final String title;
  final String? description;
  final List<Field> fields;

  const _FormStep({
    required this.title,
    this.description,
    required this.fields,
  });
}
