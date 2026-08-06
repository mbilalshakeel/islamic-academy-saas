import 'package:flutter/material.dart';

/// Zakat Calculator — simple 2.5% calculator with an adjustable Nisab.
class ZakatCalculatorScreen extends StatefulWidget {
  const ZakatCalculatorScreen({super.key});

  @override
  State<ZakatCalculatorScreen> createState() => _ZakatCalculatorScreenState();
}

class _ZakatCalculatorScreenState extends State<ZakatCalculatorScreen> {
  final TextEditingController _assets = TextEditingController();
  final TextEditingController _nisabCtrl = TextEditingController(text: '3000');
  double _nisab = 3000; // placeholder nisab (Saudi ~ SAR)
  double? _zakat;

  void _calc() {
    final assets = double.tryParse(_assets.text) ?? 0;
    setState(() {
      _zakat = assets >= _nisab ? assets * 0.025 : 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Zakat Calculator')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _assets,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Total wealth / assets',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _nisabCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Nisab threshold',
              border: OutlineInputBorder(),
            ),
            onChanged: (v) => _nisab = double.tryParse(v) ?? _nisab,
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: _calc, child: const Text('Calculate Zakat')),
          const SizedBox(height: 20),
          if (_zakat != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text('Zakat due:',
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                    const SizedBox(height: 8),
                    Text('${_zakat!.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('2.5% of wealth when above Nisab', style: const TextStyle(fontSize: 13)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
