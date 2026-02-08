import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Notification bell icon with dropdown (matching React NotificationBell).
/// Currently a stub that shows "No new notifications".
class NotificationBell extends StatelessWidget {
  final int count;

  const NotificationBell({super.key, this.count = 0});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<void>(
      tooltip: 'Notifications',
      offset: const Offset(0, 40),
      constraints: const BoxConstraints(minWidth: 280, maxWidth: 320),
      icon: Badge(
        isLabelVisible: count > 0,
        label: Text(count > 9 ? '9+' : count.toString(),
            style: const TextStyle(fontSize: 9)),
        child: const Icon(LucideIcons.bell, size: 20),
      ),
      itemBuilder: (context) => [
        PopupMenuItem<void>(
          enabled: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Notifications',
                style: Theme.of(context)
                    .textTheme
                    .titleSmall
                    ?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text(
                    'No new notifications',
                    style: TextStyle(
                        color: Colors.grey.shade400, fontSize: 13),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
