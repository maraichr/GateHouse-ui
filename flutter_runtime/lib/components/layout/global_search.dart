import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../utils/icon_mapper.dart';
import '../../utils/string_utils.dart';

/// Command-palette style global search (matching React GlobalSearch).
/// Lists entities from the spec tree for quick navigation.
class GlobalSearch extends StatefulWidget {
  final List<String> entities;

  const GlobalSearch({super.key, required this.entities});

  @override
  State<GlobalSearch> createState() => _GlobalSearchState();
}

class _GlobalSearchState extends State<GlobalSearch> {
  String _query = '';

  List<String> get _filtered {
    if (_query.isEmpty) return widget.entities;
    final q = _query.toLowerCase();
    return widget.entities
        .where((e) => e.toLowerCase().contains(q))
        .toList();
  }

  String _entityToPath(String entity) {
    // PascalCase → kebab-case: "WorkOrder" → "work-orders"
    final kebab = entity
        .replaceAllMapped(
            RegExp(r'([a-z])([A-Z])'), (m) => '${m[1]}-${m[2]}')
        .toLowerCase();
    return '/${kebab}s';
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      alignment: const Alignment(0, -0.4),
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480, maxHeight: 400),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Search input
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 8, 0),
              child: Row(
                children: [
                  Icon(mapIcon('search'),
                      size: 18, color: Theme.of(context).colorScheme.outline),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      autofocus: true,
                      decoration: const InputDecoration(
                        hintText: 'Search across entities...',
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(vertical: 12),
                      ),
                      style: const TextStyle(fontSize: 14),
                      onChanged: (v) => setState(() => _query = v),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: Icon(Icons.close,
                        size: 18, color: Theme.of(context).colorScheme.outline),
                    splashRadius: 16,
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            // Results
            Flexible(
              child: _filtered.isEmpty
                  ? Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'No results found.',
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.outline, fontSize: 13),
                      ),
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      padding: const EdgeInsets.all(8),
                      itemCount: _filtered.length,
                      itemBuilder: (context, i) {
                        final entity = _filtered[i];
                        return ListTile(
                          dense: true,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(6)),
                          leading: Icon(mapIcon('chevron-right'),
                              size: 14, color: Theme.of(context).colorScheme.outline),
                          title: Text(
                            'Go to ${humanizePascal(entity)}',
                            style: const TextStyle(fontSize: 13),
                          ),
                          onTap: () {
                            Navigator.of(context).pop();
                            context.go(_entityToPath(entity));
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Button that opens the global search dialog.
class GlobalSearchButton extends StatelessWidget {
  final List<String> entities;

  const GlobalSearchButton({super.key, required this.entities});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: () => _openSearch(context),
      icon: Icon(mapIcon('search'), size: 20),
      tooltip: 'Search (Ctrl+K)',
    );
  }

  void _openSearch(BuildContext context) {
    showDialog(
      context: context,
      barrierColor: Colors.black45,
      builder: (_) => GlobalSearch(entities: entities),
    );
  }
}

/// Registers a global Ctrl+K / Cmd+K shortcut to open search.
class GlobalSearchShortcut extends StatelessWidget {
  final List<String> entities;
  final Widget child;

  const GlobalSearchShortcut({
    super.key,
    required this.entities,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Shortcuts(
      shortcuts: {
        LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyK):
            const _OpenSearchIntent(),
        LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyK):
            const _OpenSearchIntent(),
      },
      child: Actions(
        actions: {
          _OpenSearchIntent: CallbackAction<_OpenSearchIntent>(
            onInvoke: (_) {
              showDialog(
                context: context,
                barrierColor: Colors.black45,
                builder: (_) => GlobalSearch(entities: entities),
              );
              return null;
            },
          ),
        },
        child: Focus(autofocus: true, child: child),
      ),
    );
  }
}

class _OpenSearchIntent extends Intent {
  const _OpenSearchIntent();
}
