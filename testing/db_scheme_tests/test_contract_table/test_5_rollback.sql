
-- Откат при ошибке
BEGIN;

INSERT INTO contract (id, status, client_id)
VALUES (20, 'CREATED', 1);

INSERT INTO contract (id, status, client_id)
VALUES (20, 'CREATED', 1);

ROLLBACK;


-- Проверка
SELECT * FROM contract WHERE id = 20;
