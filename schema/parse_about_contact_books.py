import re, json

with open('/home/user/uploads/index.html', encoding='utf-8') as f:
    full = f.read()

about_html = full[full.find('<div class="screen" id="screen-about">'):full.find('<div class="screen" id="screen-para-viewer">')]
contact_html = full[full.find('<div class="screen" id="screen-contact">'):full.find('<div class="screen" id="screen-about">')]
books_html = full[full.find('Islamic Books'):full.find('site-footer')]

# About: paragraphs
about_paragraphs = re.findall(r'<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">([^<]+)</p>', about_html)
about_tags = re.findall(r'font-label-sm text-label-sm">([^<]+)</span>', about_html)
offerings = re.findall(r'<span class="font-body-lg text-body-lg text-on-surface">([^<]+)</span>', about_html)
version_m = re.search(r'Version ([\d.]+)', about_html)
about = {
    "hero_title_lines": ["Islamic Coaching", "Institute"],
    "hero_tagline": "Guiding Hearts • Illuminating Minds",
    "version": version_m.group(1) if version_m else None,
    "about_paragraphs": about_paragraphs,
    "about_tags": about_tags,
    "offerings": offerings,
    "developer_name": "ICI Tech Team",
    "developer_org": "Islamic Coaching Institute",
    "footer_note": "Made with ❤️ for the Muslim Ummah",
    "copyright": "© 2024 Islamic Coaching Institute",
}

# Contact channels
phone_m = re.search(r'href="tel:([^"]+)"[\s\S]*?font-semibold text-on-surface">([^<]+)</p>', contact_html)
whatsapp_m = re.search(r'href="(https://wa\.me/[^"]+)"[\s\S]*?font-semibold text-on-surface">([^<]+)</p>', contact_html)
email_m = re.search(r'href="mailto:([^"]+)"[\s\S]*?font-semibold text-on-surface">([^<]+)</p>', contact_html)
address_m = re.search(r'Address</p>\s*(?:<!--[^>]*-->\s*)?<p[^>]*>([^<]+)</p>', contact_html)

fb_m = re.search(r'href="(https://facebook\.com/[^"]+)"[\s\S]*?font-semibold text-on-surface">([^<]+)</p>', contact_html)
yt_m = re.search(r'href="(https://youtube\.com/[^"]+)"[\s\S]*?font-semibold text-on-surface">([^<]+)</p>', contact_html)
ig_m = re.search(r'href="(https://instagram\.com/[^"]+)"[\s\S]*?font-semibold text-on-surface">([^<]+)</p>', contact_html)

hours = re.findall(r'font-body-lg text-on-surface">([^<]+)</span>\s*<!--[^>]*-->?\s*<span class="font-body-lg text-body-lg font-semibold[^"]*">([^<]+)</span>', contact_html)

contact = {
    "phone": {"value": phone_m.group(1) if phone_m else None, "label": phone_m.group(2) if phone_m else None},
    "whatsapp": {"value": whatsapp_m.group(1) if whatsapp_m else None, "label": whatsapp_m.group(2) if whatsapp_m else None},
    "email": {"value": email_m.group(1) if email_m else None, "label": email_m.group(2) if email_m else None},
    "address": address_m.group(1).strip() if address_m else None,
    "facebook": {"value": fb_m.group(1) if fb_m else None, "label": fb_m.group(2) if fb_m else None},
    "youtube": {"value": yt_m.group(1) if yt_m else None, "label": yt_m.group(2) if yt_m else None},
    "instagram": {"value": ig_m.group(1) if ig_m else None, "label": ig_m.group(2) if ig_m else None},
    "working_hours": hours,
    "footer_note_ar": "جزاك الله خيرًا",
    "footer_note_en": "May Allah reward you with goodness",
}

# Books
book_blocks = re.findall(
    r'<h4[^>]*>([^<]+)</h4>\s*<p[^>]*>([^<]+)</p>\s*<div class="flex gap-1 mt-1 flex-wrap">([\s\S]*?)</div>',
    books_html
)
books = []
for title, author, tagshtml in book_blocks:
    tags = re.findall(r'>([^<]+)</span>', tagshtml)
    books.append({"title": title.strip(), "author": author.strip(), "tags": tags})

result = {"about": about, "contact": contact, "books": books}
print(json.dumps(result, ensure_ascii=False, indent=2))
with open('/home/user/schema/about_contact_books.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
