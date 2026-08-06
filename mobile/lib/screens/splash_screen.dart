import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../flavors/app_config.dart';
import '../providers/providers.dart';
import 'home_screen.dart';

/// Splash: shows tenant logo + name, loads live theme from Supabase on
/// startup, then navigates to Home.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    // Wait for branding load + background cache refresh.
    await ref.read(startupProvider.future);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const HomeScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final branding = ref.watch(brandingProvider);
    final primary = Theme.of(context).colorScheme.primary;
    return Scaffold(
      backgroundColor: primary,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              padding: const EdgeInsets.all(8),
              child: Image.asset(
                AppConfig.current.logoAsset,
                errorBuilder: (_, __, ___) => Icon(
                  Icons.mosque,
                  size: 56,
                  color: primary,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              branding?.appName ?? AppConfig.current.appName,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            const SizedBox(
              width: 28, height: 28,
              child: CircularProgressIndicator(
                color: Colors.white, strokeWidth: 2.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
