-- TEST_NAME: invalid manager fk
-- EXPECTED: ERROR
INSERT INTO worker (id, email, role, manager_id)
VALUES (9, 'worker9@test.com', 'SURVEILLANCE_OFFICER', 999);
