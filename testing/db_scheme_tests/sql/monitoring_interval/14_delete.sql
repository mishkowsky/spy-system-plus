-- TEST_NAME: delete
-- EXPECTED: SUCCESS
BEGIN;

DELETE FROM monitoring_interval WHERE client_id = 1;
DELETE FROM client WHERE id = 1;
DELETE FROM worker WHERE id = 1;

COMMIT;