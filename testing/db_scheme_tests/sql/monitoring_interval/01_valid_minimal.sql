-- TEST_NAME: minimal valid insert
-- EXPECTED: SUCCESS
INSERT INTO monitoring_interval (id, weekday, client_id, worker_id)
VALUES (1, 'MONDAY', 1, 1);
