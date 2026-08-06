import 'dart:convert';
import 'package:http/http.dart' as http;

/// Sehri/Iftar times via the Aladhan API (same as the web app's Islamic tool).
class SehriIftarService {
  /// Fetches today's prayer timings for a city/country (default Riyadh).
  Future<Map<String, String>?> fetchTimes({
    String city = 'Riyadh',
    String country = 'Saudi Arabia',
    int method = 4,
  }) async {
    final url = Uri.parse(
        'https://api.aladhan.com/v1/timingsByCity?city=$city&country=$country&method=$method');
    try {
      final res = await http.get(url);
      if (res.statusCode != 200) return null;
      final data = jsonDecode(res.body)['data']['timings'] as Map;
      return {
        'fajr': data['Fajr']?.toString() ?? '--',
        'dhuhr': data['Dhuhr']?.toString() ?? '--',
        'asr': data['Asr']?.toString() ?? '--',
        'maghrib': data['Maghrib']?.toString() ?? '--',
        'isha': data['Isha']?.toString() ?? '--',
        'sunrise': data['Sunrise']?.toString() ?? '--',
      };
    } catch (_) {
      return null;
    }
  }
}
