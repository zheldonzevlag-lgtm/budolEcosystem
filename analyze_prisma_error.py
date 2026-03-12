import json
import os

def analyze():
    filename = 'logs_raw_v9.json'
    if not os.path.exists(filename):
        print(f"File {filename} not found.")
        return
    
    with open(filename, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
        events = data.get('events', [])
        for i, event in enumerate(events):
            msg = event.get('message', '')
            if 'PrismaClientInitializationError' in msg:
                print(f"--- ERROR AT EVENT {i} ---")
                # Print the current message and the next few messages as they might contain the stack trace
                for j in range(i, min(i + 20, len(events))):
                    print(events[j].get('message', ''))
                print("=" * 50)
                break

if __name__ == "__main__":
    analyze()
