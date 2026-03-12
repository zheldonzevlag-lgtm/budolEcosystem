import json
import os

with open('ssm_fetch_certs_res.json', 'r') as f:
    j = json.load(f)

d = json.loads(j['StandardOutputContent'])

os.makedirs('certs', exist_ok=True)

for k, v in d.items():
    if k != 'end':
        with open(f"certs/{k}.txt", 'w') as out:
            out.write(v.replace('#', '\n'))

print("Extracted successfully!")
