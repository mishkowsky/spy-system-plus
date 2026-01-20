import json
import random
import time
from datetime import datetime

import requests
from PySide6.QtCore import (
    QThread,
    Signal,
    QDateTime,
    Qt,
)
from requests.auth import HTTPBasicAuth

USERNAME = 'manager@example.com'
PASSWORD = 'managerpass'
TIMEOUT = 30
CYCLE_PERIOD = 1000


class DeviceThread(QThread):
    BASE_API_URL = 'https://localhost:9000'

    status_signal = Signal(str)
    state_signal = Signal(dict)

    post_response_signal = Signal(str)
    last_post_signal = Signal(float)

    def __init__(self, device_id, battery_level: int = 100):
        super().__init__()

        self.device_id = int(device_id)
        self.auth = HTTPBasicAuth(USERNAME, PASSWORD)

        # ---- Auth ----

        # ---- State ----
        self.battery_level = battery_level if battery_level else 100
        self.metric_level = 50
        self.is_on = True
        self.is_active = True

        self.latitude = 0.0
        self.longitude = 0.0

        self._running = True
        self.cycles_count = 0
        self.battery_discharge_pace = 5

    def fetch_latest_metric(self):
        url = f"http://localhost:8181/api/devices/{self.device_id}/metrics/latest"

        try:
            response = requests.get(
                url,
                auth=self.auth,
                timeout=TIMEOUT, verify=False
            )

            if response.status_code != 200:
                print(
                    f"[{self.device_id}] Failed to fetch latest metric:",
                    response.status_code
                )
                return

            data = response.json()

            # ---- Initialize state from backend ----
            self.metric_level = int(data.get("value", self.metric_level))
            self.battery_level = int(data.get("batteryLevel", self.battery_level))
            self.latitude = float(data.get("latitude") if data.get("latitude") else 0.0)
            self.longitude = float(data.get("longitude") if data.get("latitude") else 0.0)

            # If battery already empty → power off
            if self.battery_level <= 0:
                self.battery_level = 0
                self.is_on = False

            # Initialize "last post" time for UI
            ts = data.get("timestamp")
            if ts:
                try:
                    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                    self.last_post_signal.emit(dt.timestamp())
                except Exception:
                    pass

            print(
                f"[{self.device_id}] Initialized from latest metric "
                f"(battery={self.battery_level}, metric={self.metric_level}, ({self.longitude}, {self.latitude}))"
            )

        except requests.RequestException as e:
            print(
                f"[{self.device_id}] Error fetching latest metric:",
                e
            )

    def run(self):
        self.fetch_latest_metric()

        # Emit initial state so UI updates immediately
        self.state_signal.emit({
            "battery": self.battery_level,
            "metric": self.metric_level,
            "is_on": self.is_on,
            "is_active": self.is_active,
            "latitude": self.latitude,
            "longitude": self.longitude,
        })
        while self._running:

            # if self.battery_level > 0:
            #     self.is_on = True

            if self.battery_level <= 0 and self.is_on:
                self.battery_level = 0
                self.is_on = False
                self.post_off()
                self.state_signal.emit({
                    "battery": self.battery_level,
                    "metric": self.metric_level,
                    "is_on": self.is_on,
                    "is_active": self.is_active,
                    "latitude": self.latitude,
                    "longitude": self.longitude,
                })

            if not self.is_on:
                self.msleep(CYCLE_PERIOD)
                continue

            self.cycles_count += 1

            self.drift_state()

            if self.should_send():
                self.post_metric()

            self.state_signal.emit({
                "battery": self.battery_level,
                "metric": self.metric_level,
                "is_on": self.is_on,
                "is_active": self.is_active,
                "latitude": self.latitude,
                "longitude": self.longitude,
            })

            self.msleep(CYCLE_PERIOD)

    def stop(self):
        self._running = False

    # -------------------------
    # Conditions
    # -------------------------
    def should_send(self) -> bool:
        return (
                self.is_on
                and self.is_active
                and self.battery_level > 0
        )

    # -------------------------
    # Location drift
    # -------------------------
    def drift_state(self):
        self.latitude += random.uniform(-0.0001, 0.0001)
        self.longitude += random.uniform(-0.0001, 0.0001)

        if self.cycles_count % self.battery_discharge_pace == 0:
            self.battery_level -= 1

        self.metric_level += random.randint(-1, 1)

    def post_off(self):
        url = f"{self.BASE_API_URL}/api/devices/{self.device_id}/off"
        try:
            response = requests.post(url, timeout=TIMEOUT, verify=False)

            # Emit timestamp (even if error — attempt was made)
            self.last_post_signal.emit(time.time())

            # Emit response body (or error text)
            if response.headers.get("Content-Type", "").startswith("application/json"):
                pretty = json.dumps(response.json(), indent=2)
            else:
                pretty = response.text or "<empty response>"

            self.post_response_signal.emit(pretty)

            if response.status_code >= 300:
                print(
                    f"[{self.device_id}] POST off failed:",
                    response.status_code
                )

        except requests.RequestException as e:
            self.last_post_signal.emit(time.time())
            self.post_response_signal.emit(f"REQUEST ERROR:\n{e}")


    # -------------------------
    # POST metric (requests)
    # -------------------------
    def post_metric(self):
        url = f"{self.BASE_API_URL}/api/metrics"

        params = {
            "chargeLevel": self.battery_level
        }

        payload = {
            "deviceId": self.device_id,
            "value": self.metric_level,
            "timestamp": QDateTime.currentDateTimeUtc().toString(Qt.ISODate),
            "latitude": self.latitude,
            "longitude": self.longitude,
        }

        try:
            response = requests.post(
                url,
                params=params,
                json=payload,
                timeout=TIMEOUT, verify=False
            )

            # Emit timestamp (even if error — attempt was made)
            self.last_post_signal.emit(time.time())

            # Emit response body (or error text)
            if response.headers.get("Content-Type", "").startswith("application/json"):
                pretty = json.dumps(response.json(), indent=2)
            else:
                pretty = response.text or "<empty response>"

            self.post_response_signal.emit(pretty)

            if response.status_code >= 300:
                print(
                    f"Device #{self.device_id} POST failed:",
                    response.status_code
                )

        except requests.RequestException as e:
            self.last_post_signal.emit(time.time())
            self.post_response_signal.emit(f"REQUEST ERROR:\n{e}")

    # -------------------------
    # Setters (called from UI)
    # -------------------------
    def set_battery(self, value: int):
        if self.battery_level == 0 and value > 0:
            self.is_on = True
        self.battery_level = value

    def set_metric(self, value: int):
        self.metric_level = value

    def set_power(self, on: bool):
        self.is_on = on

    def set_active(self, active: bool):
        self.is_active = active

    def set_latitude(self, lat: float):
        self.latitude = lat

    def set_longitude(self, lon: float):
        self.longitude = lon

