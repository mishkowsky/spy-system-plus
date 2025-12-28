-- TEST_NAME: null pk
-- EXPECTED: ERROR
INSERT INTO monitoring_interval (weekday, client_id, worker_id)
VALUES ('MONDAY', 1, 1);