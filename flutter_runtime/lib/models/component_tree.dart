// Component tree models matching internal/engine/component.go exactly.
// Hand-written instead of freezed to avoid build_runner dependency at runtime.

class ComponentTree {
  final ComponentNode root;
  final TreeMetadata metadata;

  const ComponentTree({required this.root, required this.metadata});

  factory ComponentTree.fromJson(Map<String, dynamic> json) {
    return ComponentTree(
      root: ComponentNode.fromJson(json['root'] as Map<String, dynamic>),
      metadata:
          TreeMetadata.fromJson(json['metadata'] as Map<String, dynamic>),
    );
  }
}

class TreeMetadata {
  final String appName;
  final String version;
  final List<String> entities;
  final int routeCount;
  final String? target;

  const TreeMetadata({
    required this.appName,
    required this.version,
    required this.entities,
    required this.routeCount,
    this.target,
  });

  factory TreeMetadata.fromJson(Map<String, dynamic> json) {
    return TreeMetadata(
      appName: json['app_name'] as String? ?? '',
      version: json['version'] as String? ?? '',
      entities: (json['entities'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      routeCount: json['route_count'] as int? ?? 0,
      target: json['target'] as String?,
    );
  }
}

class ComponentNode {
  final String? id;
  final String kind;
  final Map<String, dynamic>? props;
  final List<ComponentNode>? children;
  final Scope? scope;
  final List<RenderCondition>? conditions;

  const ComponentNode({
    this.id,
    required this.kind,
    this.props,
    this.children,
    this.scope,
    this.conditions,
  });

  factory ComponentNode.fromJson(Map<String, dynamic> json) {
    return ComponentNode(
      id: json['id'] as String?,
      kind: json['kind'] as String? ?? 'unknown',
      props: json['props'] as Map<String, dynamic>?,
      children: (json['children'] as List<dynamic>?)
          ?.map((e) => ComponentNode.fromJson(e as Map<String, dynamic>))
          .toList(),
      scope: json['scope'] != null
          ? Scope.fromJson(json['scope'] as Map<String, dynamic>)
          : null,
      conditions: (json['conditions'] as List<dynamic>?)
          ?.map((e) => RenderCondition.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  /// Get a prop value with type safety
  T? prop<T>(String key) => props?[key] as T?;

  /// Get a string prop
  String? stringProp(String key) => props?[key]?.toString();

  /// Get a map prop
  Map<String, dynamic>? mapProp(String key) {
    final val = props?[key];
    if (val is Map) return Map<String, dynamic>.from(val);
    return null;
  }

  /// Get a list prop
  List<dynamic>? listProp(String key) {
    final val = props?[key];
    if (val is List) return val;
    return null;
  }
}

class Scope {
  final String? entity;
  final String? page;
  final String? route;

  const Scope({this.entity, this.page, this.route});

  factory Scope.fromJson(Map<String, dynamic> json) {
    return Scope(
      entity: json['entity'] as String?,
      page: json['page'] as String?,
      route: json['route'] as String?,
    );
  }
}

class RenderCondition {
  final String type;
  final List<String>? roles;

  const RenderCondition({required this.type, this.roles});

  factory RenderCondition.fromJson(Map<String, dynamic> json) {
    return RenderCondition(
      type: json['type'] as String? ?? '',
      roles: (json['roles'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
    );
  }
}
