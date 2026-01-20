INSERT INTO device_metric (
    id, device_id, client_id, metric_value, latitude, longitude, timestamp
)
SELECT
    nextval('metric_sequence') as id,
    (random() * 100)::bigint + 1 as device_id,
    (random() * 50)::bigint + 1 as client_id,
    (random() * 100)::int as metric_value,
    59.0 + (random() * 2) as latitude,
    30.0 + (random() * 2) as longitude,
    NOW() - (random() * INTERVAL '30 days') as timestamp
FROM generate_series(1, %(rows)s);
