import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'flavors/app_config.dart';
import 'providers/providers.dart';
import 'screens/splash_screen.dart';

class IciApp extends ConsumerWidget {
  const IciApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(themeProvider);
    return MaterialApp(
      title: AppConfig.current.appName,
      theme: theme,
      darkTheme: theme,
      themeMode: ref.watch(prefsProvider).darkMode
          ? ThemeMode.dark
          : ThemeMode.light,
      debugShowCheckedModeBanner: false,
      home: const SplashScreen(),
    );
  }
}
