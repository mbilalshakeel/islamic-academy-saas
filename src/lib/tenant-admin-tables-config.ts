/**
 * Whitelist-driven configuration for the generic tenant-admin CRUD API
 * (/api/tenant-admin/resource/[table]). Every table manageable through
 * Stage 1's Content Management screens is declared here explicitly —
 * there is no way to reach a table NOT listed here through this route,
 * and only the columns listed in `writableColumns` can ever be set by
 * a client, regardless of what else is in the request body.
 *
 * IMPORTANT: this whitelist is a UX/API-shape convenience, NOT the
 * tenant-isolation boundary. Every one of these tables still has RLS +
 * the stamp_tenant_id() trigger enforcing that a request can only ever
 * read/write rows belonging to the caller's own tenant_id, exactly as
 * proven earlier in this project — this config cannot widen that.
 */

export type TableConfig = {
  /** Real Postgres table name. */
  table: string;
  /** Columns a client is allowed to set via POST/PATCH. */
  writableColumns: string[];
  /** Columns required to be non-empty on create. */
  requiredOnCreate: string[];
  /** Column used for reordering (drag-to-reorder), if any. */
  sortColumn?: string;
  /** FK column name used to scope a list to a parent row, if any. */
  parentColumn?: string;
  /** Default ORDER BY column for GET (list). */
  defaultOrderBy: string;
};

export const TABLE_CONFIGS: Record<string, TableConfig> = {
  quran_editions: {
    table: "quran_editions",
    writableColumns: ["name", "line_count", "sort_order", "is_active"],
    requiredOnCreate: ["name", "line_count"],
    sortColumn: "sort_order",
    defaultOrderBy: "sort_order",
  },
  quran_paras: {
    table: "quran_paras",
    writableColumns: ["edition_id", "para_number", "name_arabic", "file_provider", "file_reference", "sort_order"],
    requiredOnCreate: ["edition_id", "para_number", "name_arabic"],
    sortColumn: "sort_order",
    parentColumn: "edition_id",
    defaultOrderBy: "sort_order",
  },
  qaida_courses: {
    table: "qaida_courses",
    writableColumns: ["name", "level_label", "color_theme", "file_provider", "file_reference", "sort_order", "is_active"],
    requiredOnCreate: ["name"],
    sortColumn: "sort_order",
    defaultOrderBy: "sort_order",
  },
  divine_names: {
    table: "divine_names",
    writableColumns: ["category", "order_index", "arabic", "transliteration", "meaning_en", "meaning_urdu", "meaning_extra"],
    requiredOnCreate: ["category", "arabic", "transliteration", "meaning_en"],
    sortColumn: "order_index",
    defaultOrderBy: "order_index",
  },
  dua_categories: {
    table: "dua_categories",
    writableColumns: ["slug", "title", "subtitle", "icon", "display_type", "sort_order"],
    requiredOnCreate: ["slug", "title"],
    sortColumn: "sort_order",
    defaultOrderBy: "sort_order",
  },
  duas: {
    table: "duas",
    writableColumns: ["category_id", "title", "subtitle", "arabic_text", "translation_en", "icon", "numbered_position", "sort_order"],
    requiredOnCreate: ["category_id", "title", "arabic_text", "translation_en"],
    sortColumn: "sort_order",
    parentColumn: "category_id",
    defaultOrderBy: "sort_order",
  },
  hadith_collections: {
    table: "hadith_collections",
    writableColumns: ["name", "sort_order"],
    requiredOnCreate: ["name"],
    sortColumn: "sort_order",
    defaultOrderBy: "sort_order",
  },
  hadiths: {
    table: "hadiths",
    writableColumns: ["collection_id", "hadith_number", "text_en", "text_arabic", "narrator", "sort_order"],
    requiredOnCreate: ["collection_id", "hadith_number", "text_en"],
    sortColumn: "sort_order",
    parentColumn: "collection_id",
    defaultOrderBy: "hadith_number",
  },
  pillars: {
    table: "pillars",
    writableColumns: ["slug", "title", "arabic_text", "description", "importance", "sort_order"],
    requiredOnCreate: ["slug", "title", "description"],
    sortColumn: "sort_order",
    defaultOrderBy: "sort_order",
  },
  pillar_details: {
    table: "pillar_details",
    writableColumns: ["pillar_id", "detail_text", "sort_order"],
    requiredOnCreate: ["pillar_id", "detail_text"],
    sortColumn: "sort_order",
    parentColumn: "pillar_id",
    defaultOrderBy: "sort_order",
  },
  pillar_guide_steps: {
    table: "pillar_guide_steps",
    writableColumns: ["pillar_id", "title", "description", "sort_order"],
    requiredOnCreate: ["pillar_id", "title", "description"],
    sortColumn: "sort_order",
    parentColumn: "pillar_id",
    defaultOrderBy: "sort_order",
  },
  prayers: {
    table: "prayers",
    writableColumns: ["name", "time_label", "rakat_fard", "rakat_sunnah", "rakat_nafl", "rakat_witr", "rakat_breakdown", "sort_order"],
    requiredOnCreate: ["name"],
    sortColumn: "sort_order",
    defaultOrderBy: "sort_order",
  },
  ritual_guides: {
    table: "ritual_guides",
    writableColumns: ["guide_type", "title", "intro_text", "sort_order"],
    requiredOnCreate: ["guide_type", "title"],
    sortColumn: "sort_order",
    defaultOrderBy: "sort_order",
  },
  ritual_guide_steps: {
    table: "ritual_guide_steps",
    writableColumns: ["guide_id", "step_number", "title", "description", "arabic_text", "icon", "sort_order"],
    requiredOnCreate: ["guide_id", "title", "description"],
    sortColumn: "sort_order",
    parentColumn: "guide_id",
    defaultOrderBy: "sort_order",
  },
  dhikr_items: {
    table: "dhikr_items",
    writableColumns: ["arabic_text", "transliteration", "translation", "default_target_count", "category", "sort_order", "is_active"],
    requiredOnCreate: ["arabic_text", "transliteration", "translation"],
    sortColumn: "sort_order",
    defaultOrderBy: "sort_order",
  },
  calendar_events: {
    table: "calendar_events",
    writableColumns: ["hijri_month", "hijri_day", "title", "description", "is_recurring_yearly", "sort_order"],
    requiredOnCreate: ["hijri_month", "hijri_day", "title"],
    sortColumn: "sort_order",
    defaultOrderBy: "sort_order",
  },
  books: {
    table: "books",
    writableColumns: [
      "title", "author", "description", "category", "language_tags",
      "cover_icon", "cover_gradient", "file_provider", "file_reference",
      "sort_order", "is_active",
    ],
    requiredOnCreate: ["title"],
    sortColumn: "sort_order",
    defaultOrderBy: "sort_order",
  },
  qa_items: {
    table: "qa_items",
    writableColumns: ["category", "question", "answer", "sort_order", "is_active"],
    requiredOnCreate: ["category", "question", "answer"],
    sortColumn: "sort_order",
    defaultOrderBy: "sort_order",
  },
  contact_channels: {
    table: "contact_channels",
    writableColumns: ["channel_type", "label", "value", "icon", "sort_order"],
    requiredOnCreate: ["channel_type", "label", "value"],
    sortColumn: "sort_order",
    defaultOrderBy: "sort_order",
  },
  home_menu_items: {
    table: "home_menu_items",
    writableColumns: ["custom_label", "is_enabled", "sort_order"],
    requiredOnCreate: [],
    sortColumn: "sort_order",
    defaultOrderBy: "sort_order",
  },
};



export function getTableConfig(table: string): TableConfig | null {
  return TABLE_CONFIGS[table] ?? null;
}

export function pickWritableFields(config: TableConfig, body: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const key of config.writableColumns) {
    if (key in body) result[key] = body[key];
  }
  return result;
}
