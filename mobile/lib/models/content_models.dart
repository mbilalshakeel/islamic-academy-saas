
class QuranEdition {
  final String id;
  final String name;
  final int lineCount;
  final int sortOrder;
  const QuranEdition(this.id, this.name, this.lineCount, this.sortOrder);
  factory QuranEdition.fromJson(Map<String, dynamic> j) => QuranEdition(
        (j['id'] ?? '').toString(),
        (j['name'] ?? '').toString(),
        (j['line_count'] as num?)?.toInt() ?? 16,
        (j['sort_order'] as num?)?.toInt() ?? 0,
      );
}

class QuranPara {
  final String id;
  final String editionId;
  final int paraNumber;
  final String nameArabic;
  final String? fileProvider;
  final String? fileReference;
  const QuranPara(this.id, this.editionId, this.paraNumber, this.nameArabic,
      this.fileProvider, this.fileReference);
  factory QuranPara.fromJson(Map<String, dynamic> j) => QuranPara(
        (j['id'] ?? '').toString(),
        (j['edition_id'] ?? '').toString(),
        (j['para_number'] as num?)?.toInt() ?? 1,
        (j['name_arabic'] ?? '').toString(),
        j['file_provider'] as String?,
        j['file_reference'] as String?,
      );
}

class QaidaCourse {
  final String id;
  final String title;
  final String? description;
  final String? levelLabel;
  const QaidaCourse(this.id, this.title, this.description, this.levelLabel);
  factory QaidaCourse.fromJson(Map<String, dynamic> j) => QaidaCourse(
        (j['id'] ?? '').toString(),
        (j['title'] ?? '').toString(),
        j['description'] as String?,
        j['level_label'] as String?,
      );
}

class DivineName {
  final String id;
  final String name;
  final String transliteration;
  final String? meaningEn;
  final String? meaningUr;
  final String? category;
  final int sortOrder;
  const DivineName(this.id, this.name, this.transliteration, this.meaningEn,
      this.meaningUr, this.category, this.sortOrder);
  factory DivineName.fromJson(Map<String, dynamic> j) => DivineName(
        (j['id'] ?? '').toString(),
        (j['name'] ?? '').toString(),
        (j['transliteration'] ?? '').toString(),
        j['meaning_en'] as String?,
        j['meaning_ur'] as String?,
        j['category'] as String?,
        (j['sort_order'] as num?)?.toInt() ?? 0,
      );
}

class DuaCategory {
  final String id;
  final String title;
  final String? slug;
  final int sortOrder;
  const DuaCategory(this.id, this.title, this.slug, this.sortOrder);
  factory DuaCategory.fromJson(Map<String, dynamic> j) => DuaCategory(
        (j['id'] ?? '').toString(),
        (j['title'] ?? '').toString(),
        j['slug'] as String?,
        (j['sort_order'] as num?)?.toInt() ?? 0,
      );
}

class Dua {
  final String id;
  final String? categoryId;
  final String? title;
  final String? arabic;
  final String? transliteration;
  final String? translationEn;
  final String? translationUr;
  const Dua(this.id, this.categoryId, this.title, this.arabic,
      this.transliteration, this.translationEn, this.translationUr);
  factory Dua.fromJson(Map<String, dynamic> j) => Dua(
        (j['id'] ?? '').toString(),
        j['category_id'] as String?,
        j['title'] as String?,
        j['arabic'] as String?,
        j['transliteration'] as String?,
        j['translation_en'] as String?,
        j['translation_ur'] as String?,
      );
}

class Hadith {
  final String id;
  final String? collectionId;
  final int hadithNumber;
  final String? textEn;
  final String? textArabic;
  final String? narrator;
  const Hadith(this.id, this.collectionId, this.hadithNumber, this.textEn,
      this.textArabic, this.narrator);
  factory Hadith.fromJson(Map<String, dynamic> j) => Hadith(
        (j['id'] ?? '').toString(),
        j['collection_id'] as String?,
        (j['hadith_number'] as num?)?.toInt() ?? 0,
        j['text_en'] as String?,
        j['text_arabic'] as String?,
        j['narrator'] as String?,
      );
}

class Pillar {
  final String id;
  final String title;
  final String? slug;
  final String? description;
  const Pillar(this.id, this.title, this.slug, this.description);
  factory Pillar.fromJson(Map<String, dynamic> j) => Pillar(
        (j['id'] ?? '').toString(),
        (j['title'] ?? '').toString(),
        j['slug'] as String?,
        j['description'] as String?,
      );
}

class Prayer {
  final String id;
  final String name;
  final String? arabicName;
  final String? description;
  const Prayer(this.id, this.name, this.arabicName, this.description);
  factory Prayer.fromJson(Map<String, dynamic> j) => Prayer(
        (j['id'] ?? '').toString(),
        (j['name'] ?? '').toString(),
        j['arabic_name'] as String?,
        j['description'] as String?,
      );
}

class Book {
  final String id;
  final String title;
  final String? author;
  final String? description;
  final String? fileProvider;
  final String? fileReference;
  final bool isActive;
  const Book(this.id, this.title, this.author, this.description,
      this.fileProvider, this.fileReference, this.isActive);
  factory Book.fromJson(Map<String, dynamic> j) => Book(
        (j['id'] ?? '').toString(),
        (j['title'] ?? '').toString(),
        j['author'] as String?,
        j['description'] as String?,
        j['file_provider'] as String?,
        j['file_reference'] as String?,
        j['is_active'] as bool? ?? true,
      );
}

class QaItem {
  final String id;
  final String? category;
  final String? question;
  final String? answer;
  final bool isActive;
  const QaItem(this.id, this.category, this.question, this.answer, this.isActive);
  factory QaItem.fromJson(Map<String, dynamic> j) => QaItem(
        (j['id'] ?? '').toString(),
        j['category'] as String?,
        j['question'] as String?,
        j['answer'] as String?,
        j['is_active'] as bool? ?? true,
      );
}

class ContactChannel {
  final String id;
  final String type;
  final String? label;
  final String? value;
  final int sortOrder;
  const ContactChannel(this.id, this.type, this.label, this.value, this.sortOrder);
  factory ContactChannel.fromJson(Map<String, dynamic> j) => ContactChannel(
        (j['id'] ?? '').toString(),
        (j['type'] ?? '').toString(),
        j['label'] as String?,
        j['value'] as String?,
        (j['sort_order'] as num?)?.toInt() ?? 0,
      );
}

class DhikrItem {
  final String id;
  final String arabicText;
  final String transliteration;
  final String? translation;
  final int defaultTargetCount;
  final String? category;
  const DhikrItem(this.id, this.arabicText, this.transliteration,
      this.translation, this.defaultTargetCount, this.category);
  factory DhikrItem.fromJson(Map<String, dynamic> j) => DhikrItem(
        (j['id'] ?? '').toString(),
        (j['arabic_text'] ?? '').toString(),
        (j['transliteration'] ?? '').toString(),
        j['translation'] as String?,
        (j['default_target_count'] as num?)?.toInt() ?? 33,
        j['category'] as String?,
      );
}

class CalendarEvent {
  final String id;
  final int hijriMonth;
  final int hijriDay;
  final String title;
  final String? description;
  const CalendarEvent(this.id, this.hijriMonth, this.hijriDay, this.title,
      this.description);
  factory CalendarEvent.fromJson(Map<String, dynamic> j) => CalendarEvent(
        (j['id'] ?? '').toString(),
        (j['hijri_month'] as num?)?.toInt() ?? 1,
        (j['hijri_day'] as num?)?.toInt() ?? 1,
        (j['title'] ?? '').toString(),
        j['description'] as String?,
      );
}

class SitePage {
  final String id;
  final String pageKey;
  final String? title;
  final String? heroTitle;
  final String? heroSubtitle;
  final List<Map<String, dynamic>>? contentBlocks;
  const SitePage(this.id, this.pageKey, this.title, this.heroTitle,
      this.heroSubtitle, this.contentBlocks);
  factory SitePage.fromJson(Map<String, dynamic> j) => SitePage(
        (j['id'] ?? '').toString(),
        (j['page_key'] ?? '').toString(),
        j['title'] as String?,
        j['hero_title'] as String?,
        j['hero_subtitle'] as String?,
        _contentBlocks(j),
      );

  static List<Map<String, dynamic>>? _contentBlocks(Map<String, dynamic> j) {
    final raw = j['content_blocks'];
    if (raw is! List) return null;
    return raw.map((e) => (e as Map).cast<String, dynamic>()).toList();
  }
}

/// Represents a single item on the tenant's home menu (from home_menu_items).
class HomeMenuItem {
  final String moduleKey;
  final String? customLabel;
  final bool isEnabled;
  final int sortOrder;
  const HomeMenuItem(this.moduleKey, this.customLabel, this.isEnabled, this.sortOrder);
  factory HomeMenuItem.fromJson(Map<String, dynamic> j) => HomeMenuItem(
        (j['module_key'] ?? '').toString(),
        j['custom_label'] as String?,
        j['is_enabled'] as bool? ?? true,
        (j['sort_order'] as num?)?.toInt() ?? 0,
      );
}
