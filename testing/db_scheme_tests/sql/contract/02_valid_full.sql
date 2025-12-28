-- TEST_NAME: full valid insert
-- EXPECTED: SUCCESS
INSERT INTO contract (
    id, client_details, created_at, start_date, end_date,
    filepath, filename, status, client_id, signer_id, signed_at
)
VALUES (
    2,
    'Test client details',
    NOW(),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    '/contracts/contract2.pdf',
    'contract2.pdf',
    'SIGNED',
    1,
    1,
    NOW()
);