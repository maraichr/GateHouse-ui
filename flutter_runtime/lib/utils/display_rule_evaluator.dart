// Evaluates structured display rules (uses "when" object, not flattened "condition")

class DisplayRuleResult {
  final String style;
  final String? tooltip;
  final String? label;

  const DisplayRuleResult({required this.style, this.tooltip, this.label});
}

DisplayRuleResult? evaluateDisplayRules(
    List<Map<String, dynamic>>? rules, dynamic value) {
  if (rules == null || rules.isEmpty || value == null) return null;

  for (final rule in rules) {
    final when = rule['when'] as Map<String, dynamic>?;
    // Fall back to condition string if when not available
    final condition = rule['condition'] as String?;

    bool matches = false;
    if (when != null) {
      matches = _evaluateWhen(when, value);
    } else if (condition != null) {
      matches = _evaluateConditionString(condition, value);
    }

    if (matches) {
      return DisplayRuleResult(
        style: rule['style'] as String? ?? '',
        tooltip: rule['tooltip'] as String?,
        label: rule['label'] as String?,
      );
    }
  }
  return null;
}

bool _evaluateWhen(Map<String, dynamic> when, dynamic value) {
  final op = when['op'] as String?;
  if (op == null) return false;

  final rhs = _resolveExprSide(when['rhs'], value);

  // lhs is typically { ref: "value" } which means the current field value
  final lhsResolved = _resolveExprSide(when['lhs'], value);

  return _compare(lhsResolved, op, rhs);
}

bool _evaluateConditionString(String condition, dynamic value) {
  // Parse "value < today + 30d" style conditions
  final parts = condition.split(RegExp(r'\s+'));
  if (parts.length < 3) return false;

  final op = parts[1];
  final rhsStr = parts.sublist(2).join(' ');
  final rhs = _resolveSymbolicDate(rhsStr);

  return _compare(value, op, rhs);
}

dynamic _resolveExprSide(dynamic side, dynamic fieldValue) {
  if (side is Map) {
    if (side.containsKey('ref')) {
      final ref = side['ref'] as String?;
      if (ref == 'value') return fieldValue;
      return fieldValue; // Default to field value for simple refs
    }
    if (side.containsKey('date_math')) {
      return _resolveSymbolicDate(side['date_math'] as String);
    }
  }
  if (side is String) return _resolveSymbolicDate(side);
  return side;
}

dynamic _resolveSymbolicDate(String expr) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);

  if (expr == 'today') return today;

  // Parse "today + 30d"
  final addMatch = RegExp(r'today\s*\+\s*(\d+)d').firstMatch(expr);
  if (addMatch != null) {
    final days = int.parse(addMatch.group(1)!);
    return today.add(Duration(days: days));
  }

  // Parse "today - 30d"
  final subMatch = RegExp(r'today\s*-\s*(\d+)d').firstMatch(expr);
  if (subMatch != null) {
    final days = int.parse(subMatch.group(1)!);
    return today.subtract(Duration(days: days));
  }

  // Try parsing as date string
  return DateTime.tryParse(expr) ?? expr;
}

bool _compare(dynamic lhs, String op, dynamic rhs) {
  if (lhs is DateTime && rhs is DateTime) {
    switch (op) {
      case '<':
        return lhs.isBefore(rhs);
      case '<=':
        return !lhs.isAfter(rhs);
      case '>':
        return lhs.isAfter(rhs);
      case '>=':
        return !lhs.isBefore(rhs);
      case '==':
        return lhs.isAtSameMomentAs(rhs);
    }
  }

  // Try parsing lhs as date if rhs is DateTime
  if (lhs is String && rhs is DateTime) {
    final lhsDate = DateTime.tryParse(lhs);
    if (lhsDate != null) return _compare(lhsDate, op, rhs);
  }

  // Numeric comparison
  final lhsNum = lhs is num ? lhs : num.tryParse(lhs.toString());
  final rhsNum = rhs is num ? rhs : num.tryParse(rhs.toString());
  if (lhsNum != null && rhsNum != null) {
    switch (op) {
      case '<':
        return lhsNum < rhsNum;
      case '<=':
        return lhsNum <= rhsNum;
      case '>':
        return lhsNum > rhsNum;
      case '>=':
        return lhsNum >= rhsNum;
      case '==':
        return lhsNum == rhsNum;
    }
  }

  return false;
}
