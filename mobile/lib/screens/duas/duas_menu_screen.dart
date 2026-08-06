import 'package:flutter/material.dart';
import '../../services/content_service.dart';

/// Daily Duas: menu → list, with modals for Kalimas / special duas.
class DuasMenuScreen extends StatelessWidget {
  const DuasMenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final duas = ContentService.instance.duas;
    return Scaffold(
      appBar: AppBar(title: const Text('Daily Duas')),
      body: duas.isEmpty
          ? const Center(child: Text('No duas yet'))
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: duas.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final d = duas[i];
                return Card(
                  child: ListTile(
                    leading: Icon(Icons.favorite,
                        color: Theme.of(context).colorScheme.primary),
                    title: Text(d.title ?? 'Dua'),
                    subtitle: d.arabic != null
                        ? Text(d.arabic!, style: const TextStyle(height: 1.8))
                        : null,
                    onTap: () => showModalBottomSheet(
                      context: context,
                      builder: (_) => _DuaDetail(d: d),
                    ),
                  ),
                );
              },
            ),
    );
  }
}

class _DuaDetail extends StatelessWidget {
  final dynamic d;
  const _DuaDetail({required this.d});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (d.title != null)
              Text(d.title as String,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            if (d.arabic != null)
              Text(d.arabic as String,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 24, height: 2.0)),
            const SizedBox(height: 12),
            if (d.transliteration != null)
              Text(d.transliteration as String, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 12),
            if (d.translation_en != null)
              Text(d.translation_en as String, style: const TextStyle(fontSize: 15)),
          ],
        ),
      ),
    );
  }
}
