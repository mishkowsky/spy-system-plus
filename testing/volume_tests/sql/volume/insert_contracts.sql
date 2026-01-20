
INSERT INTO manager (id, email, name, password)
VALUES (1, 'manager_contract@test.com', 'Manager', 'pass');

INSERT INTO contract (
    id, status, filepath, client_id, signer_id, created_at, start_date
)
SELECT
    nextval('contract_sequence') as id,
    CASE WHEN random() > 0.5 THEN 'CREATED' ELSE 'SIGNED' END as status,
    '/files/contract' || generate_series || '.pdf' as filepath,
    (random() * 999)::bigint + 1 as client_id,
    1 as signer_id,
    NOW() - (random() * INTERVAL '365 days') as created_at,
    CURRENT_DATE - (random() * 365)::int as start_date
FROM generate_series(1, %(rows)s) generate_series;
