-- TEST_NAME: valid signer fk
-- EXPECTED: SUCCESS
INSERT INTO contract (id, status, client_id, signer_id)
VALUES (10, 'SIGNED', 1, 1);