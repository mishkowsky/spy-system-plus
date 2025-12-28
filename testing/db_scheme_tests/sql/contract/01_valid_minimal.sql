-- TEST_NAME: minimal valid insert
-- EXPECTED: SUCCESS
INSERT INTO contract (id, status, client_id)
VALUES (1, 'CREATED', 1);
