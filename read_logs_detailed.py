import json
import os

def read_logs():
    for filename in ['latest_logs_v3.json']:
        if not os.path.exists(filename):
            continue
        print(f"--- Detailed Prisma Errors from {filename} ---")
        for encoding in ['utf-8', 'utf-16', 'utf-16-le', 'utf-8-sig']:
            try:
                with open(filename, 'r', encoding=encoding) as f:
                    data = json.load(f)
                    for event in data.get('events', []):
                        msg = event.get('message', '')
                        if 'PrismaClientInitializationError' in msg:
                            # Print the whole message
                            print(msg)
                            print("=" * 50)
                break 
            except:
                continue

if __name__ == "__main__":
    read_logs()
