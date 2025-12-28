-- TEST_NAME: valid client fk
-- EXPECTED: SUCCESS
INSERT INTO monitoring_interval (id, weekday, client_id, worker_id)
VALUES (8, 'THURSDAY', 1, 1);