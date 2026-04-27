import time
import requests
from datetime import datetime
from zk import ZK, const

# --- CONFIGURATION ---
DEVICE_IP = '192.168.108.114'
DEVICE_PORT = 4370
VPS_URL = 'http://164.92.110.179:8100/api/v1/bridge/sync'
POLL_INTERVAL = 60 # Check every minute

def sync_data():
    zk = ZK(DEVICE_IP, port=DEVICE_PORT, timeout=5, password=0, force_udp=False, ommit_ping=False)
    conn = None
    try:
        print(f"[{datetime.now()}] Connecting to device {DEVICE_IP}:{DEVICE_PORT}...")
        conn = zk.connect()
        
        # Disable device while reading
        conn.disable_device()
        
        attendance = conn.get_attendance()
        if not attendance:
            print("No attendance records found.")
            conn.enable_device()
            return

        print(f"Found {len(attendance)} records. Fetching SN...")
        sn = conn.get_sn()
        
        # Prepare payload
        records = []
        for entry in attendance:
            records.append({
                "user_id": str(entry.user_id),
                "timestamp": entry.timestamp.isoformat()
            })
            
        payload = {
            "sn": sn,
            "records": records
        }
        
        print(f"Pushing to VPS ({VPS_URL})...")
        response = requests.post(VPS_URL, json=payload, timeout=10)
        
        if response.status_code == 200:
            print(f"SUCCESS: {response.json().get('processed')} records saved on VPS.")
            
            # CLEAR ATTENDANCE on success to avoid duplicates next time
            print("Clearing attendance log on device...")
            conn.clear_attendance()
        else:
            print(f"ERROR: VPS returned {response.status_code}: {response.text}")

        conn.enable_device()
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
    finally:
        if conn:
            conn.disconnect()
            print("Disconnected.")

if __name__ == "__main__":
    print("--- ZKTeco Local Bridge Client Started ---")
    while True:
        sync_data()
        print(f"Waiting {POLL_INTERVAL} seconds for next sync...")
        time.sleep(POLL_INTERVAL)
