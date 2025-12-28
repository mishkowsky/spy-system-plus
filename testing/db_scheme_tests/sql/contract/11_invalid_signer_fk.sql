-- TEST_NAME: invalid signer fk
-- EXPECTED: ERROR
INSERT INTO contract (id, status, client_id, signer_id)
VALUES (11, 'SIGNED', 1, 999);