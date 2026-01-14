-- SQL-скрипт для заполнения тестовых данных
--
-- Заполняет:
-- - 100 клиентов
-- - Менеджер (уже должен существовать через TestDataLoader)
-- - 1000 метрик устройств
-- - 1000 уведомлений

DELETE FROM contract;
DELETE FROM device_change_task;
DELETE FROM device_metric;
DELETE FROM device;
DELETE FROM punishment_task;
DELETE FROM time_interval;
DELETE FROM monitoring_interval;
DELETE FROM reset_token;
DELETE FROM file;
DELETE FROM notification;
DELETE FROM client;
DELETE FROM worker;
DELETE FROM manager;

-- ============================================================================
-- СОЗДАНИЕ МЕНЕДЖЕРА
-- ============================================================================

INSERT INTO manager (id, email, name, password, is_senior)
VALUES (1, 'manager@example.com', 'Manager', '$2a$10$QGlcpRpwQoUBahrVr7bkDOFoCIC2QNMeUfUVmC0mRJ78RGWOf7uoi', true);

-- ============================================================================
-- СОЗДАНИЕ СОТРУДНИКА
-- ============================================================================

INSERT INTO worker (id, email, name, password)
VALUES (1, 'worker@example.com', 'Worker', '$2a$10$QGlcpRpwQoUBahrVr7bkDOFoCIC2QNMeUfUVmC0mRJ78RGWOf7uoi');

-- ============================================================================
-- ЗАПОЛНЕНИЕ КЛИЕНТОВ (100 клиентов)
-- ============================================================================

-- Генерация 100 клиентов
INSERT INTO client (id, email, password, name, surname, lastname, violations_count, metric_threshold, created_at, updated_at, deleted_at, can_create_new_contract)
SELECT
    nextval('client_sequence') as id,
    'client' || generate_series || '@example.com' as email,
    '$2a$10$ANd/s2HMvkZf98oD3CCp1OH3tYFz9O4fjKuB305OvIKWwwmfyzC42' as password, -- закодированный пароль "clientpass"
    'Client' || generate_series as name,
    'Surname' || generate_series as surname,
    'Lastname' || generate_series as lastname,
    (random() * 10)::int as violations_count,
    50 + (random() * 50)::int as metric_threshold,
    NOW() - (random() * INTERVAL '365 days') as created_at,
    NOW() - (random() * INTERVAL '30 days') as updated_at,
    NULL as deleted_at,
    CASE WHEN random() > 0.2 THEN true ELSE false END as can_create_new_contract
FROM generate_series(1, 100)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- ЗАПОЛНЕНИЕ УСТРОЙСТВ (devices) для POST /api/metrics
-- ============================================================================


INSERT INTO device (device_id, battery_level, assigned_client_id, assignment_status, status, last_active_time)
SELECT
    generate_series as device_id,
    (random() * 100)::int as battery_level,
    NULL as assigned_client_id,
    CASE
        WHEN random() > 0.3 THEN 'ASSIGNED'
        WHEN random() > 0.5 THEN 'UNASSIGNED'
        WHEN random() > 0.7 THEN 'ASSIGNMENT_PENDING'
        ELSE 'UNASSIGNMENT_PENDING'
    END as assignment_status,
    CASE
        WHEN random() > 0.2 THEN 'ACTIVE'
        WHEN random() > 0.5 THEN 'INACTIVE'
        ELSE 'OFF'
    END as status,
    NOW() - (random() * INTERVAL '7 days') as last_active_time
FROM generate_series(1, 50)
ON CONFLICT (device_id) DO UPDATE SET
    battery_level = EXCLUDED.battery_level,
    assigned_client_id = EXCLUDED.assigned_client_id,
    assignment_status = EXCLUDED.assignment_status,
    status = EXCLUDED.status,
    last_active_time = EXCLUDED.last_active_time;

-- ============================================================================
-- 3. ЗАПОЛНЕНИЕ МЕТРИК (1000 метрик устройств)
-- ============================================================================

INSERT INTO device_metric (id, device_id, client_id, metric_value, latitude, longitude, timestamp)
SELECT
    nextval('metric_sequence') as id,
    (random() * 49 + 1)::bigint as device_id,
    CASE
        WHEN random() > 0.1 THEN (random() * 100 + 1)::bigint  -- 90% имеют client_id
        ELSE NULL
    END as client_id,
    (random() * 100)::int as metric_value,
    59.0 + (random() * 2) as latitude,
    30.0 + (random() * 2) as longitude,
    NOW() - (random() * INTERVAL '30 days') as timestamp
FROM generate_series(1, 1000);

-- ============================================================================
-- ЗАПОЛНЕНИЕ УВЕДОМЛЕНИЙ (1000 уведомлений)
-- ============================================================================

-- Уведомления для менеджера (manager_id = 1) - ~600 уведомлений
INSERT INTO notification (id, text, type, related_entity_id, status, client_id, worker_id, manager_id, created_at)
SELECT
    nextval('notification_sequence') as id,
    CASE
        WHEN (generate_series % 10) = 0 THEN 'Новый контракт создан для клиента #' || (random() * 100 + 1)::int
        WHEN (generate_series % 10) = 1 THEN 'Батарея устройства #' || (random() * 50 + 1)::int || ' менее 15%'
        WHEN (generate_series % 10) = 2 THEN 'Устройство #' || (random() * 50 + 1)::int || ' неактивно'
        WHEN (generate_series % 10) = 3 THEN 'Устройство #' || (random() * 50 + 1)::int || ' выключено'
        WHEN (generate_series % 10) = 4 THEN 'Контракт #' || (random() * 100)::int || ' устарел'
        ELSE 'Системное уведомление #' || generate_series
    END as text,
    CASE
        WHEN (generate_series % 10) = 0 THEN 'CONTRACT_CREATION'
        WHEN (generate_series % 10) = 1 THEN 'DEVICE_LOW_BATTERY'
        WHEN (generate_series % 10) = 2 THEN 'DEVICE_INACTIVE'
        WHEN (generate_series % 10) = 3 THEN 'DEVICE_OFF'
        WHEN (generate_series % 10) = 4 THEN 'CONTRACT_OUTDATED'
        WHEN (generate_series % 10) = 5 THEN 'CONTRACT_STATUS_UPDATE'
        ELSE 'DEVICE_LOW_BATTERY'
    END as type,
    (random() * 1000)::bigint as related_entity_id,
    CASE WHEN random() > 0.4 THEN 'READ' ELSE 'UNREAD' END as status,
    NULL as client_id,
    NULL as worker_id,
    1 as manager_id,
    NOW() - (random() * INTERVAL '30 days') as created_at
FROM generate_series(1, 600);

-- Уведомления для работника (worker_id = 1) - ~200 уведомлений
INSERT INTO notification (id, text, type, related_entity_id, status, client_id, worker_id, manager_id, created_at)
SELECT
    nextval('notification_sequence') as id,
    CASE
        WHEN (generate_series % 5) = 0 THEN 'Вам назначен новый клиент: Клиент #' || (random() * 100 + 1)::int
        WHEN (generate_series % 5) = 1 THEN 'Создана новая задача наказания #' || (random() * 100)::int
        WHEN (generate_series % 5) = 2 THEN 'Задача наказания #' || (random() * 100)::int || ' отменена'
        ELSE 'Новое задание на изменение устройства'
    END as text,
    CASE
        WHEN (generate_series % 5) = 0 THEN 'NEW_CLIENT_ASSIGNED'
        WHEN (generate_series % 5) = 1 THEN 'PUNISHMENT_TASK_CREATION'
        WHEN (generate_series % 5) = 2 THEN 'TASK_CANCELLED'
        ELSE 'DEVICE_CHANGE_TASK_CREATION'
    END as type,
    (random() * 1000)::bigint as related_entity_id,
    CASE WHEN random() > 0.3 THEN 'READ' ELSE 'UNREAD' END as status,
    NULL as client_id,
    1 as worker_id,
    NULL as manager_id,
    NOW() - (random() * INTERVAL '20 days') as created_at
FROM generate_series(1, 200);

-- Уведомления для клиентов (client_id от 1 до 100) - ~200 уведомлений
INSERT INTO notification (id, text, type, related_entity_id, status, client_id, worker_id, manager_id, created_at)
SELECT
    nextval('notification_sequence') as id,
    CASE
        WHEN (generate_series % 3) = 0 THEN 'Ваш контракт был обновлен'
        WHEN (generate_series % 3) = 1 THEN 'Статус вашего контракта изменен'
        ELSE 'Новое уведомление для клиента'
    END as text,
    CASE
        WHEN (generate_series % 3) = 0 THEN 'CONTRACT_STATUS_UPDATE'
        WHEN (generate_series % 3) = 1 THEN 'CONTRACT_CREATION'
        ELSE 'CONTRACT_STATUS_UPDATE'
    END as type,
    (random() * 1000)::bigint as related_entity_id,
    CASE WHEN random() > 0.5 THEN 'READ' ELSE 'UNREAD' END as status,
    (random() * 100 + 1)::bigint as client_id,
    NULL as worker_id,
    NULL as manager_id,
    NOW() - (random() * INTERVAL '15 days') as created_at
FROM generate_series(1, 200);
