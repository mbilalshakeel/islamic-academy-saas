import re, json

with open('/home/user/schema/daily_duas_section.html', encoding='utf-8') as f:
    html = f.read()

def extract_modal(modal_id):
    # find the modal div start
    start = html.find(f'id="{modal_id}"')
    if start == -1:
        return None
    # grab a decent chunk after it
    chunk = html[start:start+3000]
    arabic_m = re.search(r'dir="rtl">([^<]+)</p>', chunk)
    trans_m = re.search(r'italic">([^<]+)</p>', chunk)
    return {
        "arabic": arabic_m.group(1).strip() if arabic_m else None,
        "translation": trans_m.group(1).strip() if trans_m else None,
    }

single_modals = {
    "iman_mujmal": extract_modal("iman-mujmal-modal"),
    "iman_mufassal": extract_modal("iman-mufassal-modal"),
    "ayat_kursi": extract_modal("ayat-kursi-modal"),
    "dua_qunoot": extract_modal("dua-qunoot-modal"),
}

# Kalimas: 6 blocks inside kalimas-modal
kalimas_start = html.find('id="kalimas-modal"')
kalimas_chunk = html[kalimas_start:]
kalima_blocks = re.findall(
    r'<span class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xs">(\d)</span>\s*'
    r'<span class="text-white font-semibold font-body-md">([^<]+)</span>\s*'
    r'</div>\s*<div class="p-md text-center">\s*'
    r'<p[^>]*dir="rtl">([^<]+)</p>\s*'
    r'<div[^>]*></div>\s*'
    r'<p[^>]*italic">([^<]+)</p>',
    kalimas_chunk
)
# The above regex might not match exactly due to differing markup; let's use a simpler split approach instead.
kalima_sections = re.split(r'<!-- Kalima \d+ -->', kalimas_chunk)[1:]
kalimas = []
for i, sec in enumerate(kalima_sections, start=1):
    title_m = re.search(r'text-white font-semibold font-body-md">([^<]+)</span>', sec)
    arabic_m = re.search(r'dir="rtl">([^<]+)</p>', sec)
    trans_m = re.search(r'italic">([^<]+)</p>', sec)
    kalimas.append({
        "number": i,
        "title": title_m.group(1).strip() if title_m else None,
        "arabic": arabic_m.group(1).strip() if arabic_m else None,
        "translation": trans_m.group(1).strip() if trans_m else None,
    })

result = {"single_modals": single_modals, "kalimas": kalimas}
print(json.dumps(result, ensure_ascii=False, indent=2))

with open('/home/user/schema/dua_modals.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
