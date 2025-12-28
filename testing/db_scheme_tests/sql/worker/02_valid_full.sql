-- TEST_NAME: full valid insert
-- EXPECTED: SUCCESS
INSERT INTO worker (
    id, email, lastname, name, password, role, surname, manager_id
)
VALUES (
    2,
    'worker2@test.com',
    'Doe',
    'Jane',
    'password123',
    'CORRECTIONS_OFFICER',
    'A',
    1
);