import 'package:flutter/material.dart';
import '../../services/content_service.dart';
import 'pdf_viewer_screen.dart';

/// Quran edition + para list (16-line and 15-line), tapping opens PDF viewer.
class QuranListScreen extends StatelessWidget {
  const QuranListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final editions = ContentService.instance.quranEditions;
    final paras = ContentService.instance.quranParas;
    return Scaffold(
      appBar: AppBar(title: const Text('Quran')),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          for (final e in editions)
            Card(
              margin: const EdgeInsets.symmetric(vertical: 4),
              child: ExpansionTile(
                leading: Icon(Icons.menu_book,
                    color: Theme.of(context).colorScheme.primary),
                title: Text(e.name),
                subtitle: Text('${e.lineCount} line edition'),
                children: [
                  for (final p in paras.where((p) => p.editionId == e.id))
                    ListTile(
                      leading: Text('${p.paraNumber}',
                          style: TextStyle(
                              color: Theme.of(context).colorScheme.primary,
                              fontWeight: FontWeight.bold)),
                      title: Text(p.nameArabic,
                          style: const TextStyle(fontSize: 18, height: 1.8)),
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => PdfViewerScreen(para: p),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          if (editions.isEmpty) const Center(child: Text('No Quran editions yet')),
        ],
      ),
    );
  }
}
