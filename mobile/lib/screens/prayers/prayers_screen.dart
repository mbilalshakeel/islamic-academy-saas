import 'package:flutter/material.dart';
import '../../services/content_service.dart';

/// Prayers: daily prayers list with descriptions (Wudu/Namaz/Other Prayers).
class PrayersScreen extends StatelessWidget {
  const PrayersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final prayers = ContentService.instance.prayers;
    return Scaffold(
      appBar: AppBar(title: const Text('Prayers & Namaz')),
      body: prayers.isEmpty
          ? const Center(child: Text('No prayer content yet'))
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: prayers.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final p = prayers[i];
                return Card(
                  child: ListTile(
                    leading: Icon(Icons.accessibility_new,
                        color: Theme.of(context).colorScheme.primary),
                    title: Text(p.name),
                    subtitle: p.arabicName != null
                        ? Text(p.arabicName!,
                            style: const TextStyle(height: 1.6))
                        : null,
                    onTap: () => showModalBottomSheet(
                      context: context,
                      builder: (_) => SafeArea(
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(p.name,
                                  style: const TextStyle(
                                      fontSize: 20, fontWeight: FontWeight.bold)),
                              if (p.arabicName != null) ...[
                                const SizedBox(height: 8),
                                Text(p.arabicName!,
                                    style: const TextStyle(fontSize: 22, height: 1.8)),
                              ],
                              const SizedBox(height: 12),
                              if (p.description != null)
                                Text(p.description!,
                                    style: const TextStyle(fontSize: 15, height: 1.6)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
