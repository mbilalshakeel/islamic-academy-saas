import re, json

with open('/home/user/schema/masnoon_duas_section.html', encoding='utf-8') as f:
    html = f.read()

cards = re.split(r'<!-- ─── DUA CARD \d+.*?-->', html)[1:]  # drop preamble before first card

results = []
for card in cards:
    # title / subtitle
    title_m = re.search(r'font-bold text-white">([^<]+)</p>', card)
    subtitle_m = re.search(r'text-white/80"[^>]*>([^<]+)</p>', card)
    icon_m = re.search(r'material-symbols-outlined text-white text-\[18px\]">([^<]+)</span>', card)
    arabic_m = re.search(r'dir="rtl">([^<]+)</p>', card)
    translation_m = re.search(r'italic">([^<]+)</p>', card)
    if not title_m:
        continue
    results.append({
        "title": title_m.group(1).strip() if title_m else None,
        "subtitle": subtitle_m.group(1).strip() if subtitle_m else None,
        "icon": icon_m.group(1).strip() if icon_m else None,
        "arabic": arabic_m.group(1).strip() if arabic_m else None,
        "translation": translation_m.group(1).strip() if translation_m else None,
    })

print(len(results))
with open('/home/user/schema/masnoon_duas.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
