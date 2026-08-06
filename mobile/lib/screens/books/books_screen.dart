import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/content_models.dart';
import '../../services/content_service.dart';

/// Islamic Books — browsable list, tap to open file link.
class BooksScreen extends StatelessWidget {
  const BooksScreen({super.key});

  static void openBook(BuildContext context, Book book) {
    showModalBottomSheet(
      context: context,
      builder: (_) => _BookDetail(book: book),
    );
  }

  @override
  Widget build(BuildContext context) {
    final books = ContentService.instance.books;
    return Scaffold(
      appBar: AppBar(title: const Text('Islamic Books')),
      body: books.isEmpty
          ? const Center(child: Text('No books yet'))
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: books.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final b = books[i];
                return Card(
                  child: ListTile(
                    leading: Icon(Icons.menu_book,
                        color: Theme.of(context).colorScheme.primary),
                    title: Text(b.title),
                    subtitle: b.author != null ? Text(b.author!) : null,
                    onTap: () => openBook(context, b),
                  ),
                );
              },
            ),
    );
  }
}

class _BookDetail extends StatelessWidget {
  final Book book;
  const _BookDetail({required this.book});

  String? _resolveUrl() {
    final ref = book.fileReference;
    if (ref == null || ref.isEmpty) return null;
    if (book.fileProvider == 'google_drive') {
      return 'https://drive.google.com/uc?export=view&id=$ref';
    }
    return ref;
  }

  Future<void> _open(BuildContext context) async {
    final url = _resolveUrl();
    if (url == null) {
      // ignore: use_build_context_synchronously
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('No file link for this book.')));
      return;
    }
    final ok = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    if (!ok) {
      // ignore: use_build_context_synchronously
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Could not open book.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(book.title,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            if (book.author != null) ...[
              const SizedBox(height: 4),
              Text(book.author!, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ],
            if (book.description != null) ...[
              const SizedBox(height: 12),
              Text(book.description!, style: const TextStyle(fontSize: 15)),
            ],
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => _open(context),
              icon: const Icon(Icons.open_in_new),
              label: const Text('Read / Open'),
            ),
          ],
        ),
      ),
    );
  }
}
