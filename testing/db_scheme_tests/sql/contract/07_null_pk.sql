-- TEST_NAME: null pk
-- EXPECTED: ERROR
INSERT INTO contract (status, client_id)
VALUES ('CREATED', 1);