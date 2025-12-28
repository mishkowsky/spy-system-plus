-- TEST_NAME: invalid weekday
-- EXPECTED: ERROR
INSERT INTO monitoring_interval (id, weekday, client_id, worker_id)
VALUES (6, 'FUNDAY', 1, 1);
