import sys
import base64
import json
import sys

from PySide6.QtCore import (
    QTimer,
)
from PySide6.QtCore import (
    QUrl,
    QByteArray,
    Qt,
)
from PySide6.QtNetwork import (
    QNetworkAccessManager,
    QNetworkRequest,
    QNetworkReply,
)
from PySide6.QtWidgets import (
    QApplication,
    QMainWindow,
    QWidget,
    QVBoxLayout,
    QGroupBox, QScrollArea, QGridLayout,
)

from device_emulator import DeviceThread
from device_widget import DeviceControl

USERNAME = 'manager@example.com'
PASSWORD = 'managerpass'
TIMEOUT = 30

class MainWindow(QMainWindow):
    REFRESH_INTERVAL_MS = 5000
    DEVICES_URL = "http://localhost:8080/api/devices"

    def __init__(self):
        super().__init__()
        self.setWindowTitle("Device Emulator Controller")
        self.resize(600, 400)

        # ---- Credentials ----
        self.username = "manager@example.com"
        self.password = "managerpass"
        self.auth_header = self.build_auth_header(
            self.username, self.password
        )

        self.device_order = []  # keeps deterministic grid order

        scroll_area = QScrollArea(self)
        scroll_area.setWidgetResizable(True)

        # container = QWidget()
        # self.layout = QVBoxLayout(container)
        # self.layout.setAlignment(Qt.AlignTop)
        self.container = QWidget()
        self.grid = QGridLayout(self.container)
        self.grid.setSpacing(12)
        self.grid.setContentsMargins(12, 12, 12, 12)

        scroll_area.setWidget(self.container)
        self.setCentralWidget(scroll_area)

        # ---- State ----
        self.device_threads = {}  # device_id -> DeviceThread
        self.device_widgets = {}  # device_id -> QGroupBox

        # ---- Network ----
        self.network = QNetworkAccessManager(self)
        self.network.finished.connect(self.on_devices_fetched)

        # ---- Auto refresh ----
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.fetch_devices)
        self.timer.start(self.REFRESH_INTERVAL_MS)

        self.fetch_devices()

    # -------------------------
    # BasicAuth helper
    # -------------------------
    def build_auth_header(self, username, password):
        token = f"{username}:{password}".encode("utf-8")
        encoded = base64.b64encode(token)
        return QByteArray(b"Basic " + encoded)

    # -------------------------
    # Fetch devices
    # -------------------------
    def fetch_devices(self):
        request = QNetworkRequest(QUrl(self.DEVICES_URL))
        request.setRawHeader(b"Authorization", self.auth_header)
        self.network.get(request)

    # -------------------------
    # Handle response
    # -------------------------
    def on_devices_fetched(self, reply):
        status = reply.attribute(
            QNetworkRequest.HttpStatusCodeAttribute
        )

        if status == 401:
            print("Unauthorized (401)")
            return

        if reply.error() != QNetworkReply.NoError:
            print(
                "Network error:",
                reply.error(),
                reply.errorString()
            )
            reply.deleteLater()
            return

        data = json.loads(bytes(reply.readAll()))
        incoming_ids = {d["deviceId"] for d in data}

        # Add new devices
        for dev in data:
            if dev["deviceId"] not in self.device_threads:
                self.add_device(dev)

        # Remove missing devices
        for device_id in list(self.device_threads.keys()):
            if device_id not in incoming_ids:
                self.remove_device(device_id)

    # -------------------------
    # Device management
    # -------------------------
    def add_device(self, dev):
        thread = DeviceThread(
            device_id=dev["deviceId"],
            battery_level=dev.get("batteryLevel", 100)
        )

        thread.status_signal.connect(self.on_status)
        thread.start()

        widget = QGroupBox(str(thread.device_id))
        widget.setFixedWidth(325)

        layout = QVBoxLayout(widget)
        layout.addWidget(DeviceControl(thread))

        self.device_threads[dev["deviceId"]] = thread
        self.device_widgets[dev["deviceId"]] = widget
        self.device_order.append(dev["deviceId"])

        self.relayout_devices()

        self.device_threads[dev["deviceId"]] = thread
        self.device_widgets[dev["deviceId"]] = widget

    def remove_device(self, device_id):
        thread = self.device_threads.pop(device_id)
        widget = self.device_widgets.pop(device_id)

        self.device_order.remove(device_id)

        thread.stop()
        thread.wait()

        widget.setParent(None)
        widget.deleteLater()

        self.relayout_devices()

        print(f"Removed device {device_id}")

    # -------------------------
    # Debug output
    # -------------------------
    def on_status(self, text):
        print(text)

    # -------------------------
    # Shutdown
    # -------------------------
    def closeEvent(self, event):
        for thread in self.device_threads.values():
            thread.stop()
            thread.wait()
        event.accept()

    def resizeEvent(self, event):
        super().resizeEvent(event)
        self.relayout_devices()

    def relayout_devices(self):
        # Clear grid
        while self.grid.count():
            item = self.grid.takeAt(0)
            if item.widget():
                item.widget().setParent(None)

        # Compute columns based on window width
        card_width = 300
        spacing = self.grid.spacing()
        available_width = self.container.width()

        columns = max(
            1,
            available_width // (card_width + spacing)
        )

        # Place widgets
        for index, device_id in enumerate(self.device_order):
            row = index // columns
            col = index % columns
            self.grid.addWidget(
                self.device_widgets[device_id],
                row,
                col,
                alignment=Qt.AlignTop
            )


# =============================
# Entry Point
# =============================
if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
