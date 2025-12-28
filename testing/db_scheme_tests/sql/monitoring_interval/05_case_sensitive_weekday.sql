-- TEST_NAME: weekday lower case
-- EXPECTED: ERROR
INSERT INTO monitoring_interval (id, weekday, client_id, worker_id)
VALUES (7, 'monday', 1, 1);