
-- Вставка минимально валидного договора (SUCCESS)
INSERT INTO contract (id, status, client_id)
VALUES (1, 'CREATED', 1);

-- Вставка полностью заполненного договора (SUCCESS)
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

-- Вставка договора с валидным статусом (SUCCESS)
INSERT INTO contract (id, status, client_id)
VALUES
    (3, 'SEND_TO_CLIENT', 1),
    (4, 'ACTIVE', 1),
    (5, 'OUTDATED', 1);

-- Вставка договора с невалидным статусом (FAIL)
INSERT INTO contract (id, status, client_id)
VALUES (6, 'INVALID_STATUS', 1);

-- Вставка для проверки чувствительности к регистру (FAIL)
INSERT INTO contract (id, status, client_id)
VALUES (7, 'created', 1);
