
-- Удаление клиента, на которого есть ссылка (FAIL)
DELETE FROM client WHERE id = 1;


-- Удаление договора, затем клиента (SUCCESS)
BEGIN;

DELETE FROM contract WHERE client_id = 1;
DELETE FROM client WHERE id = 1;

COMMIT;
