-- TEST_NAME: valid manager fk
-- EXPECTED: SUCCESS
INSERT INTO worker (id, email, role, manager_id)
VALUES (8, 'worker8@test.com', 'SURVEILLANCE_OFFICER', 1);
