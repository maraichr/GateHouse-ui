import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../api/api_client.dart';
import '../../models/component_tree.dart';
import '../../models/types.dart';
import '../../providers/auth_provider.dart';
import '../../utils/config.dart';
import '../../utils/icon_mapper.dart';
import 'data_list_widget.dart';
import 'search_bar_widget.dart';
import 'empty_state_widget.dart';
import 'filter_panel_widget.dart';
import 'filter_presets_widget.dart';

class EntityListWidget extends ConsumerStatefulWidget {
  final ComponentNode node;
  final List<ComponentNode> childNodes;

  const EntityListWidget({
    super.key,
    required this.node,
    required this.childNodes,
  });

  @override
  ConsumerState<EntityListWidget> createState() => _EntityListWidgetState();
}

class _EntityListWidgetState extends ConsumerState<EntityListWidget> {
  final ApiClient _api = ApiClient(baseUrl: AppConfig.apiBaseUrl);
  List<Map<String, dynamic>> _records = [];
  int _total = 0;
  int _page = 1;
  bool _loading = true;
  bool _error = false;
  String _search = '';
  Map<String, dynamic> _filters = {};

  // Extracted child configs
  ComponentNode? _dataViewNode;
  ComponentNode? _searchNode;
  ComponentNode? _emptyNode;
  ComponentNode? _filterPanelNode;

  @override
  void initState() {
    super.initState();
    _extractChildConfig();
    _fetchData();
  }

  void _extractChildConfig() {
    for (final child in widget.childNodes) {
      switch (child.kind) {
        case 'data_table':
          _dataViewNode = child;
          break;
        case 'filter_panel':
          _filterPanelNode = child;
          break;
        case 'search_bar':
          _searchNode = child;
          break;
        case 'empty_state':
          _emptyNode = child;
          break;
      }
    }
  }

  Future<void> _fetchData() async {
    setState(() {
      _loading = true;
      _error = false;
    });

    try {
      final resource = widget.node.stringProp('api_resource') ?? '';
      final sortConfig = widget.node.mapProp('default_sort');
      final result = await _api.getList(
        resource,
        page: _page,
        sort: sortConfig?['field'] as String?,
        order: sortConfig?['order'] as String?,
        filters: _filters.isNotEmpty ? _filters : null,
        search: _search.isNotEmpty ? _search : null,
      );
      setState(() {
        _records = result.data;
        _total = result.total;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = true;
      });
    }
  }

  void _showFilterPanel() {
    if (_filterPanelNode == null) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.6,
          maxChildSize: 0.9,
          minChildSize: 0.3,
          builder: (context, scrollController) {
            return Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Filters',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _filters = {};
                            _page = 1;
                          });
                          _fetchData();
                          Navigator.pop(context);
                        },
                        child: const Text('Reset'),
                      ),
                    ],
                  ),
                  const Divider(),
                  Expanded(
                    child: SingleChildScrollView(
                      controller: scrollController,
                      child: FilterPanelWidget(
                        node: _filterPanelNode!,
                        activeFilters: _filters,
                        onFiltersChanged: (newFilters) {
                          setState(() {
                            _filters = newFilters;
                            _page = 1;
                          });
                          _fetchData();
                        },
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  bool get _hasSidebarLayout {
    if (_filterPanelNode == null) return false;
    final config = _filterPanelNode!.mapProp('config');
    final layout = config?['layout'] ?? _filterPanelNode!.stringProp('layout');
    if (layout is String) return layout == 'sidebar';
    if (layout is Map) return (layout['flutter'] ?? layout['web']) == 'sidebar';
    // Default to sidebar when a filter panel exists
    return true;
  }

  Widget _buildSidebar() {
    return Container(
      width: 260,
      decoration: BoxDecoration(
        border: Border(
          right: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Search bar inside sidebar
          if (_searchNode != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
              child: SearchBarWidget(
                node: _searchNode!,
                value: _search,
                onChanged: (value) {
                  setState(() {
                    _search = value;
                    _page = 1;
                  });
                  _fetchData();
                },
              ),
            ),
          // Filter panel
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: FilterPanelWidget(
                node: _filterPanelNode!,
                activeFilters: _filters,
                onFiltersChanged: (newFilters) {
                  setState(() {
                    _filters = newFilters;
                    _page = 1;
                  });
                  _fetchData();
                },
              ),
            ),
          ),
          // Reset link
          if (_filters.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(12),
              child: TextButton(
                onPressed: () {
                  setState(() {
                    _filters = {};
                    _page = 1;
                  });
                  _fetchData();
                },
                child: const Text('Reset filters'),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, {bool showFilterButton = false}) {
    final permissions = ref.watch(permissionCheckerProvider);
    final title = widget.node.stringProp('title') ?? '';
    final iconName = widget.node.stringProp('icon');
    final actions = widget.node.mapProp('actions');
    final primaryActions = (actions?['primary'] as List<dynamic>?) ?? [];

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          if (iconName != null) ...[
            Icon(mapIcon(iconName), size: 24),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: Text(
              title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
          // Filter button (only on narrow/non-sidebar layouts)
          if (showFilterButton && _filterPanelNode != null)
            Padding(
              padding: const EdgeInsets.only(left: 8),
              child: Badge(
                isLabelVisible: _filters.isNotEmpty,
                label: Text(_filters.length.toString()),
                child: IconButton(
                  onPressed: _showFilterPanel,
                  icon: Icon(mapIcon('filter'), size: 18),
                  tooltip: 'Filters',
                ),
              ),
            ),
          // Primary actions
          ...primaryActions
              .where((a) {
                final perms = (a as Map<String, dynamic>)['permissions'];
                return permissions.hasPermission(perms as List<dynamic>?);
              })
              .map((a) {
                final action = a as Map<String, dynamic>;
                return Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: FilledButton.icon(
                    onPressed: () {
                      final nav = action['action'] as Map<String, dynamic>?;
                      if (nav?['type'] == 'navigate') {
                        context.go(nav!['path'] as String);
                      }
                    },
                    icon: Icon(mapIcon(action['icon'] as String?), size: 16),
                    label: Text(action['label'] as String? ?? ''),
                  ),
                );
              }),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    if (_filters.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Wrap(
        spacing: 8,
        children: [
          ..._filters.entries.map((e) {
            final displayValue = e.value is Map
                ? (e.value as Map).values.join(' \u2013 ')
                : e.value is List
                    ? (e.value as List).join(', ')
                    : e.value.toString();
            return Chip(
              label: Text('${e.key}: $displayValue',
                  style: const TextStyle(fontSize: 12)),
              onDeleted: () {
                setState(() {
                  _filters.remove(e.key);
                  _page = 1;
                });
                _fetchData();
              },
            );
          }),
          TextButton(
            onPressed: () {
              setState(() {
                _filters = {};
                _page = 1;
              });
              _fetchData();
            },
            child: const Text('Clear all'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filterPresets = _filterPanelNode?.listProp('presets') ?? [];
    final useSidebar = _hasSidebarLayout;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 840;
        final showSidebar = useSidebar && isWide && _filterPanelNode != null;

        if (showSidebar) {
          // Wide desktop layout with persistent sidebar
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSidebar(),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHeader(context),
                    if (filterPresets.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: FilterPresetsWidget(
                          presets: filterPresets,
                          activeFilters: _filters,
                          onPresetSelected: (filters) {
                            setState(() {
                              _filters = filters;
                              _page = 1;
                            });
                            _fetchData();
                          },
                        ),
                      ),
                    _buildFilterChips(),
                    Expanded(child: _buildContent(context)),
                    if (!_loading && _total > 25) _buildPagination(context),
                  ],
                ),
              ),
            ],
          );
        }

        // Narrow layout or no sidebar — original stacked layout
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(context, showFilterButton: true),
            if (_searchNode != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: SearchBarWidget(
                  node: _searchNode!,
                  value: _search,
                  onChanged: (value) {
                    setState(() {
                      _search = value;
                      _page = 1;
                    });
                    _fetchData();
                  },
                ),
              ),
            const SizedBox(height: 8),
            if (filterPresets.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: FilterPresetsWidget(
                  presets: filterPresets,
                  activeFilters: _filters,
                  onPresetSelected: (filters) {
                    setState(() {
                      _filters = filters;
                      _page = 1;
                    });
                    _fetchData();
                  },
                ),
              ),
            _buildFilterChips(),
            Expanded(child: _buildContent(context)),
            if (!_loading && _total > 25) _buildPagination(context),
          ],
        );
      },
    );
  }

  Widget _buildContent(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 48, color: Theme.of(context).colorScheme.error),
            const SizedBox(height: 8),
            const Text('Failed to load data'),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: _fetchData,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }
    if (_records.isEmpty) {
      if (_emptyNode != null) {
        return EmptyStateWidget(node: _emptyNode!);
      }
      return const Center(child: Text('No records found'));
    }

    // Get columns and fields from data view node
    final columns = (_dataViewNode?.listProp('columns') ?? [])
        .map((c) => ListColumn.fromJson(Map<String, dynamic>.from(c as Map)))
        .toList();
    final fields = (_dataViewNode?.listProp('fields') ?? [])
        .map((f) => Field.fromJson(Map<String, dynamic>.from(f as Map)))
        .toList();
    final entityRoute = widget.node.stringProp('api_resource') ?? '';

    return RefreshIndicator(
      onRefresh: _fetchData,
      child: DataListWidget(
        node: _dataViewNode ?? widget.node,
        records: _records,
        columns: columns,
        fields: fields,
        entityRoute: entityRoute,
      ),
    );
  }

  Widget _buildPagination(BuildContext context) {
    final totalPages = (_total / 25).ceil();
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Showing ${(_page - 1) * 25 + 1}\u2013${(_page * 25).clamp(0, _total)} of $_total',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          Row(
            children: [
              IconButton(
                onPressed: _page > 1
                    ? () {
                        setState(() => _page--);
                        _fetchData();
                      }
                    : null,
                icon: const Icon(Icons.chevron_left),
              ),
              Text('Page $_page of $totalPages'),
              IconButton(
                onPressed: _page < totalPages
                    ? () {
                        setState(() => _page++);
                        _fetchData();
                      }
                    : null,
                icon: const Icon(Icons.chevron_right),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
