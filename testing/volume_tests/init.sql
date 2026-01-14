-- INSERT INTO device_metric (id, device_id, client_id, metric_value, latitude, longitude, timestamp)
-- SELECT
--     nextval('metric_sequence') as id,
--     (random() * 100)::bigint + 1 as device_id,
--     (random() * 50)::bigint + 1 as client_id,
--     (random() * 100)::int as metric_value,
--     59.0 + (random() * 2) as latitude,
--     30.0 + (random() * 2) as longitude,
--     NOW() - (random() * INTERVAL '30 days') as timestamp
-- FROM generate_series(1, 10000);

-- Запрос 1.1: Получение метрик по deviceId
-- EXPLAIN ANALYZE
-- SELECT * FROM device_metric
-- WHERE device_id = 1
-- ORDER BY timestamp DESC
-- LIMIT 100;

-- Запрос 1.2: Получение метрик по clientId
-- EXPLAIN ANALYZE
-- SELECT * FROM device_metric
-- WHERE client_id = 1
-- ORDER BY timestamp DESC
-- LIMIT 100;

-- Запрос 1.3: Получение последней метрики устройства (используется в API)
-- EXPLAIN ANALYZE
-- SELECT * FROM device_metric
-- WHERE device_id = 1
-- ORDER BY timestamp DESC
-- LIMIT 1;


-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'contract';





-- Генерация клиентов
-- INSERT INTO client (id, email, password, name, surname, lastname, violations_count, metric_threshold, created_at, updated_at, deleted_at, can_create_new_contract)
-- SELECT
--     nextval('client_sequence') as id,
--     'client'  generate_series  '@example.com' as email,
--     '$2a$10$...' as password,
--     'Client' || generate_series as name,
--     'Surname' || generate_series as surname,
--     'Lastname' || generate_series as lastname,
--     (random() * 10)::int as violations_count,
--     70 as metric_threshold,
--     NOW() - (random() * INTERVAL '365 days') as created_at,
--     NOW() as updated_at,
--     NULL as deleted_at,
--     true as can_create_new_contract
-- FROM generate_series(3, 1002);


-- Генерация контрактов для менеджера (manager@example.com имеет id=1)
-- INSERT INTO contract (id, status, filepath, client_id, signer_id, created_at, start_date)
-- SELECT
--     nextval('contract_sequence') as id,
--     CASE WHEN random() > 0.5 THEN 'CREATED' ELSE 'SIGNED' END as status,
--     '/files/contract'  generate_series  '.pdf' as filepath,
--     (random() * 1000)::bigint + 1 as client_id,
--     1 as signer_id, -- manager@example.com
--     NOW() - (random() * INTERVAL '365 days') as created_at,
--     CURRENT_DATE - (random() * 365)::int as start_date
-- FROM generate_series(1, 500);



-- Запрос 2.1: Получение контрактов менеджера
-- EXPLAIN ANALYZE
-- SELECT * FROM contract
-- WHERE signer_id = 1;

-- Запрос 2.2: Получение клиентов через контракты (как в коде)
EXPLAIN ANALYZE
SELECT DISTINCT c.*
FROM client c
INNER JOIN contract ct ON ct.client_id = c.id
WHERE ct.signer_id = 1
  AND c.deleted_at IS NULL;