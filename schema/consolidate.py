import json

with open('/home/user/schema/extracted_data.json', encoding='utf-8') as f:
    d1 = json.load(f)
with open('/home/user/schema/extracted_data2.json', encoding='utf-8') as f:
    d2 = json.load(f)
with open('/home/user/schema/masnoon_duas.json', encoding='utf-8') as f:
    masnoon = json.load(f)

master = {
    "allahNames": d1["allahNames"],
    "prophetNames": d1["prophetNames"],
    "hadithList": d1["hadithList"],
    "qaData": d1["qaData"],
    "pillarData": d1["pillarData"],
    "paraNames": d1["paraNames"],
    "paraFileIds16": d1["paraFileIds"],
    "wuduSteps": d2["wuduSteps"],
    "masnoonDuas": masnoon,
}

with open('/home/user/schema/master_content.json', 'w', encoding='utf-8') as f:
    json.dump(master, f, ensure_ascii=False, indent=2)

for k, v in master.items():
    print(k, len(v) if isinstance(v, list) else len(v.keys()))
