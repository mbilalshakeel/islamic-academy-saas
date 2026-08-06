import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'services/cache_service.dart';
import 'services/notification_service.dart';
import 'services/supabase_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Local cache (Hive) — needed for instant offline startup.
  await CacheService.instance.init();

  // 2. Supabase (anon key from white-label build config; RLS for isolation).
  await SupabaseService.instance.init();

  // 3. Firebase / FCM scaffolding (best-effort — project may not be
  //    configured yet for every white-label build).
  try {
    await Firebase.initializeApp();
    await NotificationService.instance.init();
  } catch (_) {
    // Firebase not configured for this flavor yet — notifications simply
    // stay inactive; the rest of the app works normally.
  }

  runApp(
    const ProviderScope(
      child: IciApp(),
    ),
  );
}
