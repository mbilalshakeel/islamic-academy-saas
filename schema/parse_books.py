import re, json
with open('/home/user/uploads/index.html', encoding='utf-8') as f:
    full = f.read()

start = full.find('Islamic Books ═══')
end = full.find('Desktop Footer', start)
books_html = full[start:end]

block_pattern = re.compile(
    r'<h4[^>]*>([^<]+)</h4>\s*<p[^>]*>([^<]+)</p>\s*<div class="flex gap-1 mt-1 flex-wrap">(.*?)</div>',
    re.S
)
books = []
for m in block_pattern.finditer(books_html):
    tags = re.findall(r'>([^<]+)</span>', m.group(3))
    books.append({"title": m.group(1).strip(), "author": m.group(2).strip(), "tags": tags})

print(json.dumps(books, ensure_ascii=False, indent=2))
with open('/home/user/schema/books.json', 'w', encoding='utf-8') as f:
    json.dump(books, f, ensure_ascii=False, indent=2)
