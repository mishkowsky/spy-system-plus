-- TEST_NAME: null pk
-- EXPECTED: ERROR
INSERT INTO worker (email, role, manager_id)
VALUES ('worker_nullid@test.com', 'SURVEILLANCE_OFFICER', 1);
