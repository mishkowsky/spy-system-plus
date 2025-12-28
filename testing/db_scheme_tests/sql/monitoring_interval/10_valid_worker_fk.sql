-- TEST_NAME: valid worker fk
-- EXPECTED: SUCCESS
INSERT INTO monitoring_interval (id, weekday, client_id, worker_id)
VALUES (10, 'SUNDAY', 1, 1);