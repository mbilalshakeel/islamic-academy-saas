import 'package:flutter/material.dart';
import '../../services/content_service.dart';

/// Q&A — accordion with category filter.
class QaScreen extends StatelessWidget {
  const QaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final items = ContentService.instance.qaItems;
    // Unique categories for filter tabs
    final categories = <String>[
      'All',
      ...items.map((e) => e.category ?? 'General').toSet(),
    ];
    return DefaultTabController(
      length: categories.length,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Q&A'),
          bottom: TabBar(
            isScrollable: true,
            tabs: [for (final c in categories) Tab(text: c)],
          ),
        ),
        body: TabBarView(
          children: [
            for (final c in categories)
              _QaList(items: c == 'All' ? items : items.where((e) => (e.category ?? 'General') == c).toList()),
          ],
        ),
      ),
    );
  }
}

class _QaList extends StatelessWidget {
  final List<dynamic> items;
  const _QaList({required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const Center(child: Text('No Q&A yet'));
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: items.length,
      itemBuilder: (_, i) {
        final q = items[i];
        return Card(
          child: ExpansionTile(
            title: Text(q.question as String? ?? ''),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(q.answer as String? ?? ''),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
