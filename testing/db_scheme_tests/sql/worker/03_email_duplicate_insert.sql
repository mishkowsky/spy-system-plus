-- TEST_NAME: email duplicate insert
-- EXPECTED: ERROR
INSERT INTO worker (id, email, role, manager_id)
VALUES (3, 'worker1@test.com', 'SURVEILLANCE_OFFICER', 1);
