-- TEST_NAME: invalid client fk
-- EXPECTED: ERROR
INSERT INTO contract (id, status, client_id)
VALUES (9, 'CREATED', 999);