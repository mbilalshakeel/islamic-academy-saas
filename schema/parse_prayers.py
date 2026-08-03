import re, json

with open('/home/user/schema/prayers_section.html', encoding='utf-8') as f:
    html = f.read()

# Daily prayers rakat table
daily_start = html.find('id="daily-prayers"')
daily_chunk = html[daily_start:html.find('id="namaz-lessons"')]
prayer_blocks = re.findall(
    r'<h6 class="font-headline-sm">([^<]+)</h6>\s*<span class="text-label-sm text-outline">([^<]+)</span>\s*</div>\s*<span[^>]*>([^<]+)</span>',
    daily_chunk
)
prayers = [{"name": n, "rakat_text": r, "time_label": t} for n, r, t in prayer_blocks]

# Namaz lessons
lessons_chunk = html[html.find('id="namaz-lessons"'):html.find('id="how-to-perform"')]
lesson_blocks = re.findall(
    r'<h6 class="font-headline-sm text-primary mb-md">([^<]+)</h6>\s*<p[^>]*dir="rtl">([^<]+)</p>\s*<p[^>]*italic">([^<]+)</p>',
    lessons_chunk
)
namaz_lessons = [{"title": t, "arabic": a, "translation": tr} for t, a, tr in lesson_blocks]

# How to perform steps
htp_chunk = html[html.find('id="how-to-perform"'):html.find('OTHER PRAYERS MODAL')]
step_blocks = re.findall(
    r'flex-shrink-0">(\d)</div>\s*<div>\s*<h6[^>]*>([^<]+)</h6>\s*<p[^>]*>([^<]+)</p>',
    htp_chunk
)
how_to_perform = [{"step": int(s), "title": t, "desc": d} for s, t, d in step_blocks]

# Wudu intro + shahada blurb (static blocks, not JS array) -- for reference only
result = {
    "prayers": prayers,
    "namaz_lessons": namaz_lessons,
    "how_to_perform": how_to_perform,
}
print(json.dumps(result, ensure_ascii=False, indent=2))
with open('/home/user/schema/prayers_data.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
