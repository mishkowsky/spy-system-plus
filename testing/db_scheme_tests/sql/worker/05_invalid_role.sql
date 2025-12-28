-- TEST_NAME: invalid role insert
-- EXPECTED: ERROR
INSERT INTO worker (id, email, role, manager_id)
VALUES (6, 'worker6@test.com', 'ADMIN', 1);