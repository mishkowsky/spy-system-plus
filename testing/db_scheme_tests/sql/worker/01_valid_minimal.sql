-- TEST_NAME: minimal valid insert
-- EXPECTED: SUCCESS
INSERT INTO worker (id, email, role, manager_id)
VALUES (1, 'worker1@test.com', 'SURVEILLANCE_OFFICER', 1);

