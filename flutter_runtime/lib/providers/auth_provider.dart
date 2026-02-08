import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Current role notifier — reads ?role= from URL for stub auth
class CurrentRoleNotifier extends Notifier<String> {
  @override
  String build() => 'admin';

  void setRole(String role) {
    state = role;
  }
}

final currentRoleProvider =
    NotifierProvider<CurrentRoleNotifier, String>(CurrentRoleNotifier.new);

/// Permission check helper
class PermissionChecker {
  final String role;

  const PermissionChecker(this.role);

  bool hasPermission(List<dynamic>? requiredRoles) {
    if (role == 'admin') return true;
    if (requiredRoles == null || requiredRoles.isEmpty) return true;
    return requiredRoles.contains(role);
  }

  bool checkConditions(List<dynamic>? conditions) {
    if (conditions == null || conditions.isEmpty) return true;
    for (final condition in conditions) {
      if (condition is Map<String, dynamic>) {
        final type = condition['type'] as String?;
        if (type == 'permission' || type == 'role') {
          final roles = condition['roles'] as List<dynamic>?;
          if (!hasPermission(roles)) return false;
        }
      }
    }
    return true;
  }
}

final permissionCheckerProvider = Provider<PermissionChecker>((ref) {
  final role = ref.watch(currentRoleProvider);
  return PermissionChecker(role);
});
