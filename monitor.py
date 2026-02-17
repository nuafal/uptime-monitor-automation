import requests
import time
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

URLS_TO_CHECK = [
    "https://google.com",
    "https://github.com"
]

def send_alert(message):
    """Sends a message to Discord"""
    payload = {"content": message}
    try:
        response = requests.post(WEBHOOK_URL, json=payload)
        
        # NEW: Check if Discord said "OK"
        if response.status_code == 204:
            print("✅ Discord alert sent successfully!")
        else:
            print(f"❌ Failed to send alert! Status: {response.status_code}")
            print(f"Response: {response.text}") # This will print the exact error reason
            
    except Exception as e:
        print(f"Failed to send alert: {e}")

def check_sites():
    print(f"🔍 Checking sites at {datetime.now()}...")
    
    for url in URLS_TO_CHECK:
        try:
            # Try to connect (wait max 5 seconds)
            response = requests.get(url, timeout=5)
            
            # If status is NOT 200 (OK), it's an error
            if response.status_code != 200:
                error_msg = f"🚨 **ALERT:** {url} is DOWN! Status Code: {response.status_code}"
                print(error_msg)
                send_alert(error_msg)
            else:
                print(f"✅ {url} is UP ({response.elapsed.total_seconds()}s)")

        except requests.exceptions.ConnectionError:
            error_msg = f"💀 **CRITICAL:** {url} is UNREACHABLE (Connection Error)"
            print(error_msg)
            send_alert(error_msg)
        except requests.exceptions.Timeout:
            error_msg = f"zzZ **WARNING:** {url} is TIMING OUT (>5s)"
            print(error_msg)
            send_alert(error_msg)

if __name__ == "__main__":

    check_sites()
