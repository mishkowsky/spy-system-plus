-- TEST_NAME: invalid status
-- EXPECTED: ERROR
INSERT INTO contract (id, status, client_id)
VALUES (3, 'INVALID', 1);
