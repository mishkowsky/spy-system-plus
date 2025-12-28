-- TEST_NAME: pk duplicate
-- EXPECTED: ERROR
INSERT INTO monitoring_interval (id, weekday, client_id, worker_id)
VALUES (1, 'TUESDAY', 1, 1);