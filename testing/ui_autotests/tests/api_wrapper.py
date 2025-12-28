import requests

BASE_API_URL = 'http://localhost'
TIMEOUT = 10


def post_metric(device_id):
    url = f"{BASE_API_URL}/api/metrics"

    params = {
        "chargeLevel": 100
    }

    payload = {
        "deviceId": device_id,
        "value": 50,
        "timestamp": "2010-10-10T00:00:00",
        "latitude": 60.25,
        "longitude": 30,
    }

    response = requests.post(
        url,
        params=params,
        json=payload,
        timeout=TIMEOUT,
    )


def post_off(device_id):
    url = f"{BASE_API_URL}/api/devices/{device_id}/off"
    response = requests.post(url, timeout=TIMEOUT)
