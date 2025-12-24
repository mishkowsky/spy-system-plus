
-- Валидный client_id (SUCCESS)
INSERT INTO contract (id, status, client_id)
VALUES (8, 'CREATED', 1);

-- Невалидный client_id (FAIL)
INSERT INTO contract (id, status, client_id)
VALUES (9, 'CREATED', 999);

-- Валидный signer_id (SUCCESS)
INSERT INTO contract (id, status, client_id, signer_id)
VALUES (10, 'SIGNED', 1, 1);

-- Невалидный signer_id (FAIL)
INSERT INTO contract (id, status, client_id, signer_id)
VALUES (11, 'SIGNED', 1, 999);
