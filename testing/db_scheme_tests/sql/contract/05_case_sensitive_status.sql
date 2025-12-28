-- TEST_NAME: status lower case
-- EXPECTED: ERROR
INSERT INTO contract (id, status, client_id)
VALUES (7, 'created', 1);