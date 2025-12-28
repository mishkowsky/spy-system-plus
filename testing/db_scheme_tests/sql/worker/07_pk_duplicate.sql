-- TEST_NAME: pk duplicate
-- EXPECTED: ERROR
INSERT INTO worker (id, email, role, manager_id)
VALUES (1, 'worker_dup@test.com', 'SURVEILLANCE_OFFICER', 1);
