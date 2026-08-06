import 'package:flutter/material.dart';
import '../../models/content_models.dart';
import 'package:url_launcher/url_launcher.dart';

/// Opens a Quran para's PDF. If the file is a remote reference (google_drive
/// etc.) we launch the shareable link in the browser (same behaviour as the
/// web app's PDF viewer). A local pdfx-based viewer can be swapped in for
/// direct .pdf assets.
class PdfViewerScreen extends StatelessWidget {
  final QuranPara para;
  const PdfViewerScreen({super.key, required this.para});

  String? _resolveUrl() {
    final ref = para.fileReference;
    if (ref == null || ref.isEmpty) return null;
    final provider = para.fileProvider;
    if (provider == 'google_drive') {
      // web-view link works in mobile browsers
      return 'https://drive.google.com/uc?export=view&id=$ref';
    }
    return ref;
  }

  Future<void> _open(BuildContext context) async {
    final url = _resolveUrl();
    if (url == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('No PDF available for this para.')));
      return;
    }
    final ok = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    if (!ok) {
      // ignore: use_build_context_synchronously
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Could not open PDF.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text('Para ${para.paraNumber}')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.picture_as_pdf, size: 72, color: theme.colorScheme.primary),
              const SizedBox(height: 16),
              Text(para.nameArabic,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 28, height: 2.0)),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => _open(context),
                icon: const Icon(Icons.open_in_new),
                label: const Text('Open PDF'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
