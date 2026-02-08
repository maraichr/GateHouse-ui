// Evaluates state machine transition guards against a record.

class GuardResult {
  final bool passed;
  final String? failMessage;

  const GuardResult({required this.passed, this.failMessage});
}

GuardResult evaluateGuards(
    List<Map<String, dynamic>>? guards, Map<String, dynamic> record) {
  if (guards == null || guards.isEmpty) {
    return const GuardResult(passed: true);
  }

  for (final guard in guards) {
    final type = guard['type'] as String?;
    if (type == 'field_check') {
      final fieldName = guard['field_check'] as String?;
      if (fieldName != null) {
        final value = record[fieldName];
        // Check if field has a value and is not expired (for dates)
        if (value == null || value.toString().isEmpty) {
          return GuardResult(
            passed: false,
            failMessage: guard['message'] as String? ?? 'Field check failed',
          );
        }
        // Date check: field value must be after today
        final dateVal = DateTime.tryParse(value.toString());
        if (dateVal != null && dateVal.isBefore(DateTime.now())) {
          return GuardResult(
            passed: false,
            failMessage: guard['message'] as String? ?? 'Date check failed',
          );
        }
      }
    }
    // role_check is handled by permission system, skip here
  }

  return const GuardResult(passed: true);
}
