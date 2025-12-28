-- TEST_NAME: valid client fk
-- EXPECTED: SUCCESS
INSERT INTO contract (id, status, client_id)
VALUES (8, 'CREATED', 1);