-- TEST_NAME: invalid client fk
-- EXPECTED: ERROR
INSERT INTO monitoring_interval (id, weekday, client_id, worker_id)
VALUES (9, 'THURSDAY', 999, 1);