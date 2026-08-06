import 'package:flutter/material.dart';
import '../../services/cache_service.dart';
import '../../services/content_service.dart';

/// Dhikr Counter — persists counts locally (Hive), per-tenant.
class DhikrCounterScreen extends StatefulWidget {
  const DhikrCounterScreen({super.key});

  @override
  State<DhikrCounterScreen> createState() => _DhikrCounterScreenState();
}

class _DhikrCounterScreenState extends State<DhikrCounterScreen> {
  late int _activeIndex;
  final CacheService _cache = CacheService.instance;

  @override
  void initState() {
    super.initState();
    _activeIndex = 0;
  }

  @override
  Widget build(BuildContext context) {
    final items = ContentService.instance.dhikrItems;
    if (items.isEmpty) return const Scaffold(body: Center(child: Text('No dhikr items yet')));
    final active = items[_activeIndex];
    final count = _cache.dhikrCount(active.id);

    return Scaffold(
      appBar: AppBar(title: const Text('Dhikr Counter')),
      body: Column(
        children: [
          // item selector
          SizedBox(
            height: 60,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.all(8),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) => ChoiceChip(
                label: Text(items[i].transliteration),
                selected: i == _activeIndex,
                onSelected: (_) => setState(() => _activeIndex = i),
              ),
            ),
          ),
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(active.arabicText,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontSize: 32, height: 2.0,
                          color: Theme.of(context).colorScheme.primary)),
                  const SizedBox(height: 12),
                  Text(active.translation ?? '',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 14)),
                  const SizedBox(height: 24),
                  Text('$count',
                      style: const TextStyle(fontSize: 64, fontWeight: FontWeight.bold)),
                  Text('of ${active.defaultTargetCount}', style: const TextStyle(fontSize: 16)),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                      value: active.defaultTargetCount > 0 ? count / active.defaultTargetCount : 0,
                      minHeight: 8),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      IconButton.filledTonal(
                        iconSize: 44,
                        icon: const Icon(Icons.touch_app),
                        tooltip: 'Tap',
                        onPressed: () {
                          final next = count + 1;
                          _cache.setDhikrCount(active.id, next);
                          setState(() {});
                        },
                      ),
                      const SizedBox(width: 20),
                      IconButton(
                        icon: const Icon(Icons.refresh),
                        tooltip: 'Reset',
                        onPressed: () => setState(() => _cache.setDhikrCount(active.id, 0)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
