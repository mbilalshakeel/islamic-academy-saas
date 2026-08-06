import 'package:flutter/material.dart';
import '../../services/content_service.dart';

/// 40 Hadiths list.
class HadithScreen extends StatelessWidget {
  const HadithScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final hadiths = ContentService.instance.hadiths;
    return Scaffold(
      appBar: AppBar(title: const Text('40 Hadiths')),
      body: hadiths.isEmpty
          ? const Center(child: Text('No hadiths yet'))
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: hadiths.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final h = hadiths[i];
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      foregroundColor: Colors.white,
                      child: Text('${h.hadithNumber}'),
                    ),
                    title: Text(h.textEn ?? ''),
                    subtitle: h.textArabic != null
                        ? Text(h.textArabic!, textAlign: TextAlign.right,
                            style: const TextStyle(height: 1.8))
                        : null,
                    isThreeLine: true,
                  ),
                );
              },
            ),
    );
  }
}
