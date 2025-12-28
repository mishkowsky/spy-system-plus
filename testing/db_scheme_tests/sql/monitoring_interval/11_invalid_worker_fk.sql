-- TEST_NAME: invalid signer fk
-- EXPECTED: ERROR
INSERT INTO monitoring_interval (id, weekday, client_id, worker_id)
VALUES (11, 'SUNDAY', 1, 999);