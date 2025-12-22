import time

from PySide6.QtCore import QTimer, Qt
from PySide6.QtWidgets import (
    QWidget,
    QVBoxLayout,
    QLabel,
    QSlider,
    QDoubleSpinBox, QCheckBox, QPlainTextEdit, )


class DeviceControl(QWidget):
    def __init__(self, device):
        super().__init__()
        self.device = device
        self.updating_ui = False
        self.last_post_ts = None

        layout = QVBoxLayout(self)

        # ---- Power / Active ----
        self.power_cb = QCheckBox("Power ON")
        self.power_cb.setChecked(True)
        self.power_cb.toggled.connect(device.set_power)

        self.active_cb = QCheckBox("Active")
        self.active_cb.setChecked(True)
        self.active_cb.toggled.connect(device.set_active)

        layout.addWidget(self.power_cb)
        layout.addWidget(self.active_cb)

        # ---- Battery ----
        self.battery_label = QLabel("Battery: 100%")
        self.battery_slider = QSlider(Qt.Horizontal)
        self.battery_slider.setRange(0, 100)
        self.battery_slider.valueChanged.connect(self.on_battery_changed)

        layout.addWidget(self.battery_label)
        layout.addWidget(self.battery_slider)

        # ---- Metric ----
        self.metric_label = QLabel("Metric: 50")
        self.metric_slider = QSlider(Qt.Horizontal)
        self.metric_slider.setRange(0, 100)
        self.metric_slider.valueChanged.connect(self.on_metric_changed)

        self.battery_label.setMargin(0)
        self.metric_label.setMargin(0)

        layout.addWidget(self.metric_label)
        layout.addWidget(self.metric_slider)

        # ---- Location ----
        self.lat_spin = QDoubleSpinBox()
        self.lat_spin.setRange(-90, 90)
        self.lat_spin.setDecimals(6)
        self.lat_spin.valueChanged.connect(device.set_latitude)

        self.lon_spin = QDoubleSpinBox()
        self.lon_spin.setRange(-180, 180)
        self.lon_spin.setDecimals(6)
        self.lon_spin.valueChanged.connect(device.set_longitude)

        layout.addWidget(QLabel("Latitude"))
        layout.addWidget(self.lat_spin)
        layout.addWidget(QLabel("Longitude"))
        layout.addWidget(self.lon_spin)

        # ---- Last POST info ----
        self.last_post_label = QLabel("Last POST: never")
        layout.addWidget(self.last_post_label)

        # ---- Response body ----
        layout.addWidget(QLabel("Last response"))
        self.response_view = QPlainTextEdit()
        self.response_view.setReadOnly(True)
        self.response_view.setFixedHeight(175)
        layout.addWidget(self.response_view)

        # ---- Signals from device ----
        device.state_signal.connect(self.update_state)
        device.post_response_signal.connect(self.update_response)
        device.last_post_signal.connect(self.update_last_post)

        # ---- Timer to update "X seconds ago" ----
        self.elapsed_timer = QTimer(self)
        self.elapsed_timer.timeout.connect(self.refresh_elapsed)
        self.elapsed_timer.start(1000)

    # -------------------------
    # UI → Device
    # -------------------------
    def on_battery_changed(self, value):
        if not self.updating_ui:
            self.device.set_battery(value)

    def on_metric_changed(self, value):
        if not self.updating_ui:
            self.device.set_metric(value)

    def on_power_off(self):
        pass
    # -------------------------
    # Device → UI
    # -------------------------
    def update_state(self, state: dict):
        self.updating_ui = True

        self.power_cb.setChecked(state["is_on"])
        self.active_cb.setChecked(state["is_active"])

        self.battery_slider.setValue(state["battery"])
        self.battery_label.setText(f"Battery: {state['battery']}%")

        self.metric_slider.setValue(state["metric"])
        self.metric_label.setText(f"Metric: {state['metric']}")

        self.lat_spin.setValue(state["latitude"])
        self.lon_spin.setValue(state["longitude"])

        self.updating_ui = False

    def update_response(self, text: str):
        self.response_view.setPlainText(text)

    def update_last_post(self, ts: float):
        self.last_post_ts = ts
        self.refresh_elapsed()

    def refresh_elapsed(self):
        if self.last_post_ts is None:
            self.last_post_label.setText("Last POST: never")
            return

        delta = int(time.time() - self.last_post_ts)
        self.last_post_label.setText(
            f"Last POST: {delta} second{'s' if delta != 1 else ''} ago"
        )
