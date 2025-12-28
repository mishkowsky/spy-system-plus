-- TEST_NAME: valid role insert
-- EXPECTED: SUCCESS
INSERT INTO worker (id, email, role, manager_id)
VALUES
    (4, 'worker4@test.com', 'SURVEILLANCE_OFFICER', 1),
    (5, 'worker5@test.com', 'CORRECTIONS_OFFICER', 1);