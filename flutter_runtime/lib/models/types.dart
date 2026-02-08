// Field type helpers matching runtime/src/types.ts

class Field {
  final String name;
  final String type;
  final String? displayName;
  final bool required;
  final bool hidden;
  final bool primaryKey;
  final bool immutable;
  final dynamic computed;
  final bool sensitive;
  final String? maskPattern;
  final bool sortable;
  final bool filterable;
  final List<EnumValue>? values;
  final Map<String, bool>? showIn;
  final String? displayAs;
  final List<Map<String, dynamic>>? displayRules;
  final String? placeholder;
  final String? helpText;
  final int? minLength;
  final int? maxLength;
  final dynamic min;
  final dynamic max;
  final String? pattern;
  final String? patternMessage;
  final bool futureOnly;
  final String? entity;
  final Map<String, dynamic>? items;
  final String? inputType;
  final String? currency;
  final String? format;
  final Map<String, dynamic>? components;
  final Map<String, dynamic>? permissions;

  const Field({
    required this.name,
    required this.type,
    this.displayName,
    this.required = false,
    this.hidden = false,
    this.primaryKey = false,
    this.immutable = false,
    this.computed,
    this.sensitive = false,
    this.maskPattern,
    this.sortable = false,
    this.filterable = false,
    this.values,
    this.showIn,
    this.displayAs,
    this.displayRules,
    this.placeholder,
    this.helpText,
    this.minLength,
    this.maxLength,
    this.min,
    this.max,
    this.pattern,
    this.patternMessage,
    this.futureOnly = false,
    this.entity,
    this.items,
    this.inputType,
    this.currency,
    this.format,
    this.components,
    this.permissions,
  });

  factory Field.fromJson(Map<String, dynamic> json) {
    return Field(
      name: json['name'] as String? ?? '',
      type: json['type'] as String? ?? 'string',
      displayName: json['display_name'] as String?,
      required: json['required'] as bool? ?? false,
      hidden: json['hidden'] as bool? ?? false,
      primaryKey: json['primary_key'] as bool? ?? false,
      immutable: json['immutable'] as bool? ?? false,
      computed: json['computed'],
      sensitive: json['sensitive'] as bool? ?? false,
      maskPattern: json['mask_pattern'] as String?,
      sortable: json['sortable'] as bool? ?? false,
      filterable: json['filterable'] as bool? ?? false,
      values: (json['values'] is List)
          ? (json['values'] as List)
              .map((e) => EnumValue.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList()
          : null,
      showIn: (json['show_in'] is Map)
          ? Map<String, dynamic>.from(json['show_in'] as Map).map(
              (k, v) => MapEntry(k, v as bool),
            )
          : null,
      displayAs: json['display_as'] as String?,
      displayRules: (json['display_rules'] is List)
          ? (json['display_rules'] as List)
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList()
          : null,
      placeholder: json['placeholder'] as String?,
      helpText: json['help_text'] as String?,
      minLength: json['min_length'] as int?,
      maxLength: json['max_length'] as int?,
      min: json['min'],
      max: json['max'],
      pattern: json['pattern'] as String?,
      patternMessage: json['pattern_message'] as String?,
      futureOnly: json['future_only'] as bool? ?? false,
      entity: json['entity'] as String?,
      items: json['items'] is Map ? Map<String, dynamic>.from(json['items'] as Map) : null,
      inputType: json['input_type'] as String?,
      currency: json['currency'] as String?,
      format: json['format'] as String?,
      components: json['components'] is Map ? Map<String, dynamic>.from(json['components'] as Map) : null,
      permissions: json['permissions'] is Map ? Map<String, dynamic>.from(json['permissions'] as Map) : null,
    );
  }

  /// Check if this field should be shown in a given context
  bool shownIn(String context) => showIn?[context] ?? false;
}

class EnumValue {
  final String value;
  final String label;
  final String? color;
  final String? icon;

  const EnumValue({
    required this.value,
    required this.label,
    this.color,
    this.icon,
  });

  factory EnumValue.fromJson(Map<String, dynamic> json) {
    return EnumValue(
      value: json['value'] as String? ?? '',
      label: json['label'] as String? ?? '',
      color: json['color'] as String?,
      icon: json['icon'] as String?,
    );
  }
}

class ListColumn {
  final String field;
  final dynamic width;
  final String? fixed;
  final dynamic linkTo;
  final int? maxDisplay;
  final String? displayField;

  const ListColumn({
    required this.field,
    this.width,
    this.fixed,
    this.linkTo,
    this.maxDisplay,
    this.displayField,
  });

  factory ListColumn.fromJson(Map<String, dynamic> json) {
    return ListColumn(
      field: json['field'] as String? ?? '',
      width: json['width'],
      fixed: json['fixed'] as String?,
      linkTo: json['link_to'],
      maxDisplay: json['max_display'] as int?,
      displayField: json['display_field'] as String?,
    );
  }

  bool get isDetailLink {
    if (linkTo == 'detail') return true;
    if (linkTo is Map) return (linkTo as Map)['type'] == 'route';
    return false;
  }
}

class StateMachine {
  final String field;
  final String initial;
  final List<Transition> transitions;

  const StateMachine({
    required this.field,
    required this.initial,
    required this.transitions,
  });

  factory StateMachine.fromJson(Map<String, dynamic> json) {
    return StateMachine(
      field: json['field'] as String? ?? '',
      initial: json['initial'] as String? ?? '',
      transitions: (json['transitions'] as List<dynamic>?)
              ?.map((e) => Transition.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class Transition {
  final String name;
  final String label;
  final List<String> from;
  final String to;
  final String? icon;
  final String? color;
  final Map<String, dynamic>? confirmation;
  final List<Map<String, dynamic>>? guards;
  final List<dynamic>? permissions;
  final List<Map<String, dynamic>>? form;

  const Transition({
    required this.name,
    required this.label,
    required this.from,
    required this.to,
    this.icon,
    this.color,
    this.confirmation,
    this.guards,
    this.permissions,
    this.form,
  });

  factory Transition.fromJson(Map<String, dynamic> json) {
    // form can be a List of fields or a Map with a "fields" key
    final rawForm = json['form'];
    List<Map<String, dynamic>>? formFields;
    if (rawForm is List) {
      formFields = rawForm.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } else if (rawForm is Map) {
      final inner = rawForm['fields'];
      if (inner is List) {
        formFields = inner.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      }
    }

    return Transition(
      name: json['name'] as String? ?? '',
      label: json['label'] as String? ?? '',
      from: (json['from'] is List)
              ? (json['from'] as List).map((e) => e as String).toList()
              : [],
      to: json['to'] as String? ?? '',
      icon: json['icon'] as String?,
      color: json['color'] as String?,
      confirmation: json['confirmation'] is Map
          ? Map<String, dynamic>.from(json['confirmation'] as Map)
          : null,
      guards: (json['guards'] is List)
          ? (json['guards'] as List)
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList()
          : null,
      permissions: (json['permissions'] is List)
          ? json['permissions'] as List<dynamic>
          : null,
      form: formFields,
    );
  }
}
