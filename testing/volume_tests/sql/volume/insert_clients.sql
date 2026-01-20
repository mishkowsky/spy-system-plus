INSERT INTO client (
    id, email, password, name, surname, lastname,
    violations_count, metric_threshold,
    created_at, updated_at, deleted_at, can_create_new_contract
)
SELECT
    nextval('client_sequence') as id,
    'client' || generate_series || '@example.com' as email,
    '$2a$10$...' as password,
    'Client' || generate_series as name,
    'Surname' || generate_series as surname,
    'Lastname' || generate_series as lastname,
    (random() * 10)::int as violations_count,
    70 as metric_threshold,
    NOW() - (random() * INTERVAL '365 days') as created_at,
    NOW() as updated_at,
    NULL as deleted_at,
    true as can_create_new_contract
FROM generate_series(1, %(rows)s) generate_series;
