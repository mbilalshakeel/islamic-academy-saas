import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/providers.dart';
import '../services/theme_service.dart';
import '../services/content_service.dart';
import 'about/about_screen.dart';
import 'books/books_screen.dart';
import 'contact/contact_screen.dart';
import 'duas/duas_menu_screen.dart';
import 'hadith/hadith_screen.dart';
import 'names/names_screen.dart';
import 'pillars/pillars_screen.dart';
import 'prayers/prayers_screen.dart';
import 'qa/qa_screen.dart';
import 'qaida/qaida_screen.dart';
import 'quran/quran_list_screen.dart';
import 'settings/settings_screen.dart';
import 'tools/sehri_iftar_screen.dart';
import 'tools/dhikr_counter_screen.dart';
import 'tools/hijri_calendar_screen.dart';
import 'tools/zakat_calculator_screen.dart';

/// A home-menu module: key → label + destination.
class _Module {
  final String key;
  final String label;
  final IconData icon;
  final Widget Function() screen;
  const _Module(this.key, this.label, this.icon, this.screen);
}

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _tab = 0;

  static const _reading = <_Module>[
    _Module('quran', 'Quran', Icons.menu_book, QuranListScreen.new),
    _Module('qaida', 'Qaida', Icons.abc, QaidaScreen.new),
    _Module('names', 'Allah & Prophet Names', Icons.star, NamesScreen.new),
    _Module('duas', 'Daily Duas', Icons.favorite, DuasMenuScreen.new),
    _Module('hadith', '40 Hadiths', Icons.format_quote, HadithScreen.new),
    _Module('pillars', 'Pillars of Islam', Icons.home_repair_service, PillarsScreen.new),
    _Module('prayers', 'Prayers & Namaz', Icons.accessibility_new, PrayersScreen.new),
    _Module('books', 'Islamic Books', Icons.library_books, BooksScreen.new),
    _Module('qa', 'Q&A', Icons.help_outline, QaScreen.new),
  ];

  static const _learning = <_Module>[
    _Module('sehri_iftar', 'Sehri & Iftar', Icons.schedule, SehriIftarScreen.new),
    _Module('dhikr', 'Dhikr Counter', Icons.touch_app, DhikrCounterScreen.new),
    _Module('calendar', 'Hijri Calendar', Icons.calendar_month, HijriCalendarScreen.new),
    _Module('zakat', 'Zakat Calculator', Icons.calculate, ZakatCalculatorScreen.new),
  ];

  bool _enabled(String key) {
    for (final m in ContentService.instance.homeMenuItems) {
      if (m.moduleKey == key) return m.isEnabled;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final branding = ref.watch(brandingProvider);
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;
    final onPrimary = ThemeService.onColor(primary);

    // Respect tenant home menu config from DB.
    final reading = _reading.where((m) => _enabled(m.key)).toList();
    final learning = _learning.where((m) => _enabled(m.key)).toList();

    final pages = <Widget>[
      _buildHome(context, branding, reading, learning, onPrimary),
      const QaScreen(),
      const AboutScreen(),
      const ContactScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: _tab, children: pages),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _tab,
        type: BottomNavigationBarType.fixed,
        onTap: (i) => setState(() => _tab = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.help), label: 'Q&A'),
          BottomNavigationBarItem(icon: Icon(Icons.info), label: 'About'),
          BottomNavigationBarItem(icon: Icon(Icons.contact_mail), label: 'Contact'),
        ],
      ),
    );
  }

  Widget _buildHome(BuildContext context, branding, List<_Module> reading,
      List<_Module> learning, Color onPrimary) {
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;
    return SafeArea(
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: primary,
            foregroundColor: onPrimary,
            pinned: true,
            title: Text(branding?.appName ?? 'ICI'),
            actions: [
              IconButton(
                icon: const Icon(Icons.settings),
                tooltip: 'Settings',
                onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const SettingsScreen())),
              ),
            ],
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Bismillah hero
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        Text('بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
                            textAlign: TextAlign.center,
                            style: ThemeService.arabic(branding, 20, primary)),
                        if (branding?.tagline != null) ...[
                          const SizedBox(height: 6),
                          Text(branding!.tagline!,
                              textAlign: TextAlign.center,
                              style: TextStyle(color: theme.colorScheme.onSurface)),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  _sectionTitle('Reading'),
                  const SizedBox(height: 10),
                  _moduleGrid(reading),
                  const SizedBox(height: 20),
                  _sectionTitle('Learning & Tools'),
                  const SizedBox(height: 10),
                  _moduleGrid(learning),
                  const SizedBox(height: 20),
                  _sectionTitle('Islamic Books'),
                  const SizedBox(height: 10),
                  _booksCarousel(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String t) => Text(t,
      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold));

  Widget _moduleGrid(List<_Module> modules) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3, mainAxisSpacing: 10, crossAxisSpacing: 10),
      itemCount: modules.length,
      itemBuilder: (_, i) {
        final m = modules[i];
        return InkWell(
          onTap: () => Navigator.push(
              context, MaterialPageRoute(builder: (_) => m.screen())),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(m.icon, size: 30, color: Theme.of(context).colorScheme.primary),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Text(m.label, textAlign: TextAlign.center,
                      maxLines: 2, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _booksCarousel() {
    final books = ContentService.instance.books;
    if (books.isEmpty) {
      return const Text('No books yet');
    }
    return SizedBox(
      height: 160,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: books.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) {
          final b = books[i];
          return InkWell(
            onTap: () => BooksScreen.openBook(context, b),
            child: Container(
              width: 130,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.menu_book, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(height: 8),
                  Text(b.title, maxLines: 3, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
