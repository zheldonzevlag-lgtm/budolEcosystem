import json

try:
    with open('logs_raw.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    for event in data.get('events', []):
        print(event.get('message', ''))
except Exception as e:
    print(f"Error: {e}")
