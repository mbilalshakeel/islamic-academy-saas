import 'package:flutter/material.dart';
import '../../services/content_service.dart';

/// Pillars of Islam — tabbed view (Shahada/Salah/Zakat/Sawm/Hajj).
class PillarsScreen extends StatelessWidget {
  const PillarsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pillars = ContentService.instance.pillars;
    return Scaffold(
      appBar: AppBar(title: const Text('Pillars of Islam')),
      body: pillars.isEmpty
          ? const Center(child: Text('No pillars yet'))
          : DefaultTabController(
              length: pillars.length,
              child: Column(
                children: [
                  TabBar(
                    isScrollable: true,
                    tabs: [
                      for (final p in pillars) Tab(text: p.title),
                    ],
                  ),
                  Expanded(
                    child: TabBarView(
                      children: [
                        for (final p in pillars)
                          SingleChildScrollView(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(p.title,
                                    style: const TextStyle(
                                        fontSize: 22, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 12),
                                if (p.description != null)
                                  Text(p.description!,
                                      style: const TextStyle(fontSize: 16, height: 1.6)),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
