import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/providers.dart';

/// Settings: language (English/Urdu), font size, dark mode toggle.
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(prefsProvider);
    final notifier = ref.read(prefsProvider.notifier);
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Language', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'en', label: Text('English')),
              ButtonSegment(value: 'ur', label: Text('اردو')),
            ],
            selected: {prefs.language},
            onSelectionChanged: (s) => notifier.setLanguage(s.first),
          ),
          const Divider(height: 32),
          const Text('Font Size', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.text_fields),
              Expanded(
                child: Slider(
                  value: prefs.fontSize,
                  min: 12,
                  max: 24,
                  divisions: 12,
                  label: prefs.fontSize.round().toString(),
                  onChanged: (v) => notifier.setFontSize(v),
                ),
              ),
              Text('${prefs.fontSize.round()}'),
            ],
          ),
          const Divider(height: 32),
          SwitchListTile(
            title: const Text('Dark Mode'),
            subtitle: const Text('Toggle dark theme'),
            value: prefs.darkMode,
            onChanged: (v) => notifier.setDarkMode(v),
          ),
        ],
      ),
    );
  }
}
