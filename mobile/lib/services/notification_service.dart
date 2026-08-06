import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Firebase Cloud Messaging scaffolding.
///
/// NOTE: this wires up FCM + local notifications so that push messaging is
/// READY for future sender integration. The sender side (institute admin
/// sending announcements) is backend work outside this Flutter build — see
/// the README's "Push notifications" section for how the admin would later
/// publish via the Supabase/FCM admin SDK.
class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final FlutterLocalNotificationsPlugin _local =
      FlutterLocalNotificationsPlugin();
  String? _token;

  String? get token => _token;

  Future<void> init() async {
    // FCM initialization (Firebase must be configured per project).
    final messaging = FirebaseMessaging.instance;
    try {
      _token = await messaging.getToken();
    } catch (_) {}

    // Request permission (Android 13+ / iOS).
    await messaging.requestPermission(alert: true, badge: true, sound: true);

    // Foreground presentation.
    await FirebaseMessaging.instance
        .setForegroundNotificationPresentationOptions(
      alert: true, badge: true, sound: true,
    );

    // Local notifications plugin (used to show system notifications when the
    // app is in the foreground).
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const darwinInit = DarwinInitializationSettings();
    await _local.initialize(
      const InitializationSettings(android: androidInit, iOS: darwinInit),
    );
  }

  /// Shows a local notification (used for FCM messages received while the
  /// app is in foreground).
  Future<void> showNotification(String title, String body) async {
    const android = AndroidNotificationDetails(
      'announcements', 'Institute Announcements',
      channelDescription: 'Notifications from your institute',
      importance: Importance.high, priority: Priority.high,
    );
    const ios = DarwinNotificationDetails();
    await _local.show(0, title, body,
        const NotificationDetails(android: android, iOS: ios));
  }
}
