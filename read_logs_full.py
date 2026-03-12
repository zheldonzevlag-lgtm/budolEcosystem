import json
import os

def read_logs():
    for filename in ['latest_logs_v3.json']:
        if not os.path.exists(filename):
            continue
        print(f"--- Full Messages from {filename} ---")
        for encoding in ['utf-8', 'utf-16', 'utf-16-le', 'utf-8-sig']:
            try:
                with open(filename, 'r', encoding=encoding) as f:
                    data = json.load(f)
                    for event in data.get('events', []):
                        msg = event.get('message', '')
                        if 'PrismaClientInitializationError' in msg:
                            print(msg)
                            print("-" * 20)
                break 
            except:
                continue

if __name__ == "__main__":
    read_logs()
