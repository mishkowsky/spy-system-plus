SELECT *
FROM device_metric
WHERE client_id = 1
ORDER BY timestamp DESC
LIMIT 100;
