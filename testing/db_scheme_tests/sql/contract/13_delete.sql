-- TEST_NAME: delete contract
-- EXPECTED: SUCCESS
BEGIN;

DELETE FROM contract WHERE client_id = 1;
DELETE FROM client WHERE id = 1;

COMMIT;