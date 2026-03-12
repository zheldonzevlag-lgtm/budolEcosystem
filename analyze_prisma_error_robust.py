import json
import os

def analyze():
    filename = 'logs_raw_v9.json'
    if not os.path.exists(filename):
        print(f"File {filename} not found.")
        return
    
    # Try multiple encodings
    for encoding in ['utf-16', 'utf-16-le', 'utf-8', 'utf-8-sig']:
        try:
            with open(filename, 'r', encoding=encoding) as f:
                data = json.load(f)
                events = data.get('events', [])
                print(f"Successfully loaded with {encoding}")
                for i, event in enumerate(events):
                    msg = event.get('message', '')
                    if 'PrismaClientInitializationError' in msg:
                        print(f"--- ERROR AT EVENT {i} ---")
                        for j in range(i, min(i + 20, len(events))):
                            print(events[j].get('message', ''))
                        print("=" * 50)
                return
        except Exception as e:
            continue
    print("Could not load file with any encoding.")

if __name__ == "__main__":
    analyze()
