import 'package:flutter/material.dart';
import '../../services/content_service.dart';

/// Qaida course list + reader.
class QaidaScreen extends StatelessWidget {
  const QaidaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final courses = ContentService.instance.qaidaCourses;
    return Scaffold(
      appBar: AppBar(title: const Text('Qaida')),
      body: courses.isEmpty
          ? const Center(child: Text('No Qaida courses yet'))
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: courses.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final c = courses[i];
                return Card(
                  child: ListTile(
                    leading: Icon(Icons.abc,
                        color: Theme.of(context).colorScheme.primary),
                    title: Text(c.title),
                    subtitle: c.levelLabel != null ? Text(c.levelLabel!) : null,
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => _QaidaViewer(course: c)),
                    ),
                  ),
                );
              },
            ),
    );
  }
}

class _QaidaViewer extends StatelessWidget {
  final dynamic course;
  const _QaidaViewer({required this.course});

  @override
  Widget build(BuildContext context) {
    final c = course;
    return Scaffold(
      appBar: AppBar(title: Text(c.title as String)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(c.title as String,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              if (c.description != null)
                Text(c.description as String, textAlign: TextAlign.center),
              const SizedBox(height: 24),
              Text('Lessons for this course will load here.',
                  style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ],
          ),
        ),
      ),
    );
  }
}
