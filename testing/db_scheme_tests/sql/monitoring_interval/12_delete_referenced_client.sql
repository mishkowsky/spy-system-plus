-- TEST_NAME: delete referenced client
-- EXPECTED: ERROR
DELETE FROM client WHERE id = 1;