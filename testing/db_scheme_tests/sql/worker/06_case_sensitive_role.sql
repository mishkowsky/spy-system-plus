-- TEST_NAME: role lower case
-- EXPECTED: ERROR
INSERT INTO worker (id, email, role, manager_id)
VALUES (7, 'worker7@test.com', 'surveillance_officer', 1);