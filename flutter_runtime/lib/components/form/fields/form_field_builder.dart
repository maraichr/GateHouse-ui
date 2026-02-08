import 'package:flutter/material.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:form_builder_validators/form_builder_validators.dart';
import '../../../models/types.dart';

/// Build text field validators list
String? Function(String?) _textValidator(Field field) {
  final validators = <String? Function(String?)>[];
  if (field.required) validators.add(FormBuilderValidators.required());
  if (field.minLength != null) {
    validators.add(FormBuilderValidators.minLength(field.minLength!));
  }
  if (field.maxLength != null) {
    validators.add(FormBuilderValidators.maxLength(field.maxLength!));
  }
  if (field.pattern != null) {
    validators.add(FormBuilderValidators.match(RegExp(field.pattern!),
        errorText: field.patternMessage ?? 'Invalid format'));
  }
  return FormBuilderValidators.compose(validators);
}

/// Builds the appropriate form field widget based on field type.
Widget buildFormField({
  required Field field,
  bool enabled = true,
  dynamic initialValue,
}) {
  switch (field.type) {
    case 'string':
    case 'phone':
      return FormBuilderTextField(
        name: field.name,
        decoration: InputDecoration(
          labelText: field.displayName ?? field.name,
          hintText: field.placeholder,
          helperText: field.helpText,
        ),
        enabled: enabled,
        initialValue: initialValue?.toString(),
        validator: _textValidator(field),
        keyboardType:
            field.type == 'phone' ? TextInputType.phone : TextInputType.text,
      );

    case 'email':
      return FormBuilderTextField(
        name: field.name,
        decoration: InputDecoration(
          labelText: field.displayName ?? field.name,
          hintText: field.placeholder ?? 'email@example.com',
        ),
        enabled: enabled,
        initialValue: initialValue?.toString(),
        validator: FormBuilderValidators.compose([
          if (field.required) FormBuilderValidators.required(),
          FormBuilderValidators.email(),
        ]),
        keyboardType: TextInputType.emailAddress,
      );

    case 'enum':
      return FormBuilderDropdown<String>(
        name: field.name,
        decoration: InputDecoration(
          labelText: field.displayName ?? field.name,
        ),
        enabled: enabled,
        initialValue: initialValue?.toString(),
        validator: field.required
            ? FormBuilderValidators.required()
            : null,
        items: (field.values ?? [])
            .map((v) => DropdownMenuItem(
                  value: v.value,
                  child: Text(v.label),
                ))
            .toList(),
      );

    case 'date':
    case 'datetime':
      return FormBuilderDateTimePicker(
        name: field.name,
        decoration: InputDecoration(
          labelText: field.displayName ?? field.name,
        ),
        enabled: enabled,
        initialValue: initialValue is String
            ? DateTime.tryParse(initialValue)
            : initialValue as DateTime?,
        inputType: field.type == 'date'
            ? InputType.date
            : InputType.both,
        validator: field.required
            ? FormBuilderValidators.required()
            : null,
        firstDate: field.futureOnly ? DateTime.now() : null,
      );

    case 'decimal':
    case 'integer':
    case 'number':
      return FormBuilderTextField(
        name: field.name,
        decoration: InputDecoration(
          labelText: field.displayName ?? field.name,
        ),
        enabled: enabled,
        initialValue: initialValue?.toString(),
        validator: FormBuilderValidators.compose([
          if (field.required) FormBuilderValidators.required(),
          FormBuilderValidators.numeric(),
          if (field.min != null)
            FormBuilderValidators.min(
                (field.min as num).toDouble()),
          if (field.max != null)
            FormBuilderValidators.max(
                (field.max as num).toDouble()),
        ]),
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
      );

    case 'currency':
      return FormBuilderTextField(
        name: field.name,
        decoration: InputDecoration(
          labelText: field.displayName ?? field.name,
          prefixText: field.currency == 'USD' ? '\$ ' : '',
        ),
        enabled: enabled,
        initialValue: initialValue?.toString(),
        validator: FormBuilderValidators.compose([
          if (field.required) FormBuilderValidators.required(),
          FormBuilderValidators.numeric(),
        ]),
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
      );

    case 'richtext':
      return FormBuilderTextField(
        name: field.name,
        decoration: InputDecoration(
          labelText: field.displayName ?? field.name,
          alignLabelWithHint: true,
        ),
        enabled: enabled,
        initialValue: initialValue?.toString(),
        validator: _textValidator(field),
        maxLines: 5,
        minLines: 3,
      );

    case 'address':
      return _AddressFormField(field: field, enabled: enabled,
          initialValue: initialValue as Map<String, dynamic>?);

    case 'array':
      if (field.inputType == 'multi_select' && field.items != null) {
        return FormBuilderCheckboxGroup<String>(
          name: field.name,
          decoration: InputDecoration(
            labelText: field.displayName ?? field.name,
          ),
          enabled: enabled,
          initialValue: initialValue is List
              ? initialValue.map((e) => e.toString()).toList()
              : [],
          options: const [], // Would need reference data; placeholder
        );
      }
      return FormBuilderTextField(
        name: field.name,
        decoration: InputDecoration(
          labelText: field.displayName ?? field.name,
          helperText: 'Enter comma-separated values',
        ),
        enabled: enabled,
        initialValue:
            initialValue is List ? initialValue.join(', ') : initialValue?.toString(),
      );

    default:
      return FormBuilderTextField(
        name: field.name,
        decoration: InputDecoration(
          labelText: field.displayName ?? field.name,
        ),
        enabled: enabled,
        initialValue: initialValue?.toString(),
        validator: _textValidator(field),
      );
  }
}

class _AddressFormField extends StatelessWidget {
  final Field field;
  final bool enabled;
  final Map<String, dynamic>? initialValue;

  const _AddressFormField({
    required this.field,
    required this.enabled,
    this.initialValue,
  });

  @override
  Widget build(BuildContext context) {
    final components = field.components ?? {};
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          field.displayName ?? field.name,
          style: Theme.of(context).textTheme.titleSmall,
        ),
        const SizedBox(height: 8),
        FormBuilderTextField(
          name: '${field.name}.street1',
          decoration: const InputDecoration(labelText: 'Street Address'),
          enabled: enabled,
          initialValue: initialValue?['street1']?.toString(),
          validator: components['street1']?['required'] == true
              ? FormBuilderValidators.required()
              : null,
        ),
        const SizedBox(height: 8),
        FormBuilderTextField(
          name: '${field.name}.street2',
          decoration: const InputDecoration(labelText: 'Street Address 2'),
          enabled: enabled,
          initialValue: initialValue?['street2']?.toString(),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              flex: 2,
              child: FormBuilderTextField(
                name: '${field.name}.city',
                decoration: const InputDecoration(labelText: 'City'),
                enabled: enabled,
                initialValue: initialValue?['city']?.toString(),
                validator: components['city']?['required'] == true
                    ? FormBuilderValidators.required()
                    : null,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: FormBuilderTextField(
                name: '${field.name}.state',
                decoration: const InputDecoration(labelText: 'State'),
                enabled: enabled,
                initialValue: initialValue?['state']?.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: FormBuilderTextField(
                name: '${field.name}.zip',
                decoration: const InputDecoration(labelText: 'ZIP'),
                enabled: enabled,
                initialValue: initialValue?['zip']?.toString(),
                validator: components['zip']?['required'] == true
                    ? FormBuilderValidators.required()
                    : null,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
