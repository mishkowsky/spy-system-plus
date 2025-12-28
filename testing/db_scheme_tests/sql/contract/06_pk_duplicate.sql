-- TEST_NAME: pk duplicate
-- EXPECTED: ERROR
INSERT INTO contract (id, status, client_id)
VALUES (1, 'CREATED', 1);