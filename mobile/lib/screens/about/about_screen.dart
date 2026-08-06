import 'package:flutter/material.dart';
import '../../services/content_service.dart';

/// About Us — renders rich/block content from the About page.
class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final page = ContentService.instance.sitePage('about');
    final blocks = page?.contentBlocks ?? [];
    return Scaffold(
      appBar: AppBar(title: const Text('About')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (page?.heroTitle != null)
            Text(page!.heroTitle!,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          if (page?.heroSubtitle != null) ...[
            const SizedBox(height: 8),
            Text(page!.heroSubtitle!, style: const TextStyle(fontSize: 15)),
          ],
          const SizedBox(height: 16),
          if (blocks.isEmpty)
            const Text('About content coming soon.')
          else
            for (final b in blocks) _renderBlock(context, b),
        ],
      ),
    );
  }

  Widget _renderBlock(BuildContext context, Map<String, dynamic> b) {
    final type = b['type'] as String? ?? 'paragraph';
    final content = b['content'] as String? ?? b['text'] as String? ?? '';
    if (type == 'paragraph') {
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Text(content, style: const TextStyle(fontSize: 15, height: 1.6)),
      );
    }
    if (type == 'list') {
      final items = (b['items'] as List?)?.map((e) => e.toString()).toList() ?? [];
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final it in items) Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('• '),
              Expanded(child: Text(it)),
            ],
          ),
          const SizedBox(height: 12),
        ],
      );
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(content, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
    );
  }
}
