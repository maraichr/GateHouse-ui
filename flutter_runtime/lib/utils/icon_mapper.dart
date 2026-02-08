import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Maps Lucide icon name strings (kebab-case from spec) to Flutter IconData.
IconData mapIcon(String? name) {
  if (name == null || name.isEmpty) return LucideIcons.circle;
  return _iconMap[name] ?? LucideIcons.circle;
}

final Map<String, IconData> _iconMap = {
  'layout-dashboard': LucideIcons.layoutDashboard,
  'hard-hat': LucideIcons.hardHat,
  'briefcase': LucideIcons.briefcase,
  'file-text': LucideIcons.fileText,
  'bar-chart-2': LucideIcons.chartBar,
  'settings': LucideIcons.settings,
  'shield-check': LucideIcons.shieldCheck,
  'plus': LucideIcons.plus,
  'download': LucideIcons.download,
  'check-circle': LucideIcons.circleCheck,
  'alert-triangle': LucideIcons.triangleAlert,
  'x-circle': LucideIcons.circleX,
  'clock': LucideIcons.clock,
  'pause-circle': LucideIcons.circlePause,
  'refresh-cw': LucideIcons.refreshCw,
  'search': LucideIcons.search,
  'filter': LucideIcons.funnel,
  'chevron-left': LucideIcons.chevronLeft,
  'chevron-right': LucideIcons.chevronRight,
  'edit': LucideIcons.pencil,
  'trash-2': LucideIcons.trash2,
  'info': LucideIcons.info,
  'star': LucideIcons.star,
  'users': LucideIcons.users,
  'building': LucideIcons.building,
  'calendar': LucideIcons.calendar,
  'mail': LucideIcons.mail,
  'phone': LucideIcons.phone,
  'map-pin': LucideIcons.mapPin,
  'dollar-sign': LucideIcons.dollarSign,
  'hash': LucideIcons.hash,
  'eye': LucideIcons.eye,
  'eye-off': LucideIcons.eyeOff,
  'clipboard': LucideIcons.clipboard,
  'clipboard-list': LucideIcons.clipboardList,
  'truck': LucideIcons.truck,
  'wrench': LucideIcons.wrench,
  'home': LucideIcons.house,
  'arrow-left': LucideIcons.arrowLeft,
  'arrow-right': LucideIcons.arrowRight,
  'more-vertical': LucideIcons.ellipsisVertical,
  'chevron-down': LucideIcons.chevronDown,
  'chevron-up': LucideIcons.chevronUp,
  'x': LucideIcons.x,
  'menu': LucideIcons.menu,
  'circle': LucideIcons.circle,
};
