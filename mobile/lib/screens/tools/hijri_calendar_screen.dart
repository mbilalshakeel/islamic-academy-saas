import 'package:flutter/material.dart';
import '../../services/content_service.dart';

/// Hijri Calendar — lists yearly recurring events from the tenant content.
class HijriCalendarScreen extends StatelessWidget {
  const HijriCalendarScreen({super.key});

  static const _months = [
    'Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Awwal','Jumada al-Thani',
    'Rajab','Shaban','Ramadan','Shawwal','Dhul-Qadah','Dhul-Hijjah',
  ];

  @override
  Widget build(BuildContext context) {
    final events = ContentService.instance.calendarEvents;
    return Scaffold(
      appBar: AppBar(title: const Text('Hijri Calendar')),
      body: events.isEmpty
          ? const Center(child: Text('No calendar events yet'))
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: events.length,
              itemBuilder: (_, i) {
                final e = events[i];
                final month = e.hijriMonth >= 1 && e.hijriMonth <= 12
                    ? _months[e.hijriMonth - 1]
                    : '${e.hijriMonth}';
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      foregroundColor: Colors.white,
                      child: Text('${e.hijriDay}'),
                    ),
                    title: Text(e.title),
                    subtitle: Text('$e.hijriDay $month'),
                    isThreeLine: e.description != null,
                    onTap: e.description == null ? null : () => showModalBottomSheet(
                      context: context,
                      builder: (_) => SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(e.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 8),
                              Text(e.description!),
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
