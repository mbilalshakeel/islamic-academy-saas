import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/content_service.dart';

/// Contact Us — tap-to-call / tap-to-whatsapp / email / map / social.
class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});

  Future<void> _launch(String url) async {
    final ok = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    if (!ok) {
      // ignore: use_build_context_synchronously
      // launch failure is silent here (UI already open)
    }
  }

  Widget _item(BuildContext context, IconData icon, String label, String? value,
      void Function()? onTap) {
    if (value == null || value.isEmpty) return const SizedBox.shrink();
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
      title: Text(label),
      subtitle: Text(value),
      trailing: onTap != null ? const Icon(Icons.chevron_right) : null,
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    final channels = ContentService.instance.contactChannels;
    String? val(String type) {
      for (final c in channels) {
        if (c.type == type) return c.value;
      }
      return null;
    }

    final phone = val('phone');
    final whatsapp = val('whatsapp');
    final email = val('email');
    final address = val('address');

    return Scaffold(
      appBar: AppBar(title: const Text('Contact')),
      body: ListView(
        children: [
          _item(context, Icons.phone, 'Call', phone,
              phone == null ? null : () => _launch('tel:${phone.replaceAll(' ', '')}')),
          _item(context, Icons.chat, 'WhatsApp', whatsapp,
              whatsapp == null ? null : () => _launch('https://wa.me/${whatsapp.replaceAll('+', '').replaceAll(' ', '')}')),
          _item(context, Icons.email, 'Email', email,
              email == null ? null : () => _launch('mailto:$email')),
          _item(context, Icons.location_on, 'Address', address,
              address == null ? null : () => _launch('https://maps.google.com/?q=${Uri.encodeComponent(address)}')),
          if (channels.isEmpty) const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: Text('No contact details yet')),
          ),
        ],
      ),
    );
  }
}
