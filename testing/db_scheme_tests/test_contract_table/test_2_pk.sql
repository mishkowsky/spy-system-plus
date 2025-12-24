
-- Дубликат первичного ключа (FAIL)
INSERT INTO contract (id, status, client_id)
VALUES (1, 'CREATED', 1);

-- Null первичный ключ (FAIL)
INSERT INTO contract (status, client_id)
VALUES ('CREATED', 1);


