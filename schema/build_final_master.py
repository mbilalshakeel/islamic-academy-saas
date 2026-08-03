import json

with open('/home/user/schema/master_content.json', encoding='utf-8') as f:
    master = json.load(f)
with open('/home/user/schema/dua_modals.json', encoding='utf-8') as f:
    dua_modals = json.load(f)
with open('/home/user/schema/prayers_data.json', encoding='utf-8') as f:
    prayers_data = json.load(f)
with open('/home/user/schema/about_contact_books.json', encoding='utf-8') as f:
    acb = json.load(f)
with open('/home/user/schema/books.json', encoding='utf-8') as f:
    books = json.load(f)

# Fix working hours manually verified from source (regex didn't catch it due to inline comment)
acb['contact']['working_hours'] = [
    {"label": "Monday — Friday", "value": "9:00 AM — 6:00 PM"},
    {"label": "Saturday", "value": "10:00 AM — 4:00 PM"},
    {"label": "Sunday", "value": "Closed"},
]
acb['books'] = books

final = {
    **master,
    "duaModals": dua_modals,
    "prayersData": prayers_data,
    "about": acb['about'],
    "contact": acb['contact'],
    "books": acb['books'],
}

with open('/home/user/schema/final_master_content.json', 'w', encoding='utf-8') as f:
    json.dump(final, f, ensure_ascii=False, indent=2)

for k, v in final.items():
    if isinstance(v, list):
        print(k, len(v))
    elif isinstance(v, dict):
        print(k, list(v.keys()))
