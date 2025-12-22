
# device-emulator
- делает запросы к бэку для получения списка устройств `/api/devices` и их последнего состояния `/api/devices/{device_id}/metrics/latest`
- создает для каждого устройства свой поток
- раз в секунду (CYCLE_PERIOD) шлет запрос со своим состоянием `/api/metrics`

## запуск
requiers installed `python`
```commandline
python3 -m venv .venv

pip install requirements.txt

python main_window.py
```