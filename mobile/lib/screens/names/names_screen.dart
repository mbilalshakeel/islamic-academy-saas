import 'package:flutter/material.dart';
import '../../services/content_service.dart';

/// Allah's 99 Names + Prophet's Names (grid with Arabic/English/Urdu).
class NamesScreen extends StatelessWidget {
  const NamesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final names = ContentService.instance.divineNames;
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Names'),
          bottom: const TabBar(tabs: [
            Tab(text: 'Allah'),
            Tab(text: 'Prophet'),
          ]),
        ),
        body: TabBarView(
          children: [
            _NamesGrid(names: names),
            const Center(child: Text('Prophet names will load here.')),
          ],
        ),
      ),
    );
  }
}

class _NamesGrid extends StatelessWidget {
  final List<dynamic> names;
  const _NamesGrid({required this.names});

  @override
  Widget build(BuildContext context) {
    if (names.isEmpty) return const Center(child: Text('No names yet'));
    return GridView.builder(
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3, mainAxisSpacing: 10, crossAxisSpacing: 10,
          childAspectRatio: 0.85),
      itemCount: names.length,
      itemBuilder: (_, i) {
        final n = names[i];
        return InkWell(
          onTap: () => showModalBottomSheet(
            context: context,
            builder: (_) => _NameDetail(n: n),
          ),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.all(8),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(n.name as String,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 18, height: 1.8,
                        color: Theme.of(context).colorScheme.primary)),
                const SizedBox(height: 4),
                Text(n.transliteration as String,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12)),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _NameDetail extends StatelessWidget {
  final dynamic n;
  const _NameDetail({required this.n});

  @override
  Widget build(BuildContext context) {

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(n.name as String,
                style: TextStyle(
                    fontSize: 30, height: 2.0,
                    color: Theme.of(context).colorScheme.primary)),
            const SizedBox(height: 8),
            Text(n.transliteration as String,
                style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 12),
            Text(n.meaning_en as String? ?? '', textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
