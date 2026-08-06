import 'package:flutter/material.dart';
import '../../services/sehri_iftar_service.dart';

/// Sehri/Iftar times via Aladhan API (city/method selectable).
class SehriIftarScreen extends StatefulWidget {
  const SehriIftarScreen({super.key});

  @override
  State<SehriIftarScreen> createState() => _SehriIftarScreenState();
}

class _SehriIftarScreenState extends State<SehriIftarScreen> {
  Map<String, String>? _times;
  bool _loading = true;
  String _city = 'Riyadh';
  String _country = 'Saudi Arabia';

  Future<void> _load() async {
    setState(() => _loading = true);
    final t = await SehriIftarService().fetchTimes(city: _city, country: _country);
    setState(() {
      _times = t;
      _loading = false;
    });
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sehri & Iftar'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _times == null
              ? const Center(child: Text('Could not load times. Check internet.'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    DropdownButtonFormField<String>(
                      value: _city,
                      decoration: const InputDecoration(labelText: 'City'),
                      items: const [
                        DropdownMenuItem(value: 'Riyadh', child: Text('Riyadh')),
                        DropdownMenuItem(value: 'Makkah', child: Text('Makkah')),
                        DropdownMenuItem(value: 'Madinah', child: Text('Madinah')),
                        DropdownMenuItem(value: 'Karachi', child: Text('Karachi')),
                      ],
                      onChanged: (v) {
                        if (v != null) {
                          setState(() => _city = v);
                          _load();
                        }
                      },
                    ),
                    const SizedBox(height: 16),
                    Card(
                      child: Column(
                        children: [
                          _row(context, 'Sehri (Fajr)', _times!['fajr']!),
                          _row(context, 'Sunrise', _times!['sunrise']!),
                          _row(context, 'Dhuhr', _times!['dhuhr']!),
                          _row(context, 'Asr', _times!['asr']!),
                          _row(context, 'Iftar (Maghrib)', _times!['maghrib']!),
                          _row(context, 'Isha', _times!['isha']!),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _row(BuildContext context, String label, String value) {
    return ListTile(
      title: Text(label),
      trailing: Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
    );
  }
}
