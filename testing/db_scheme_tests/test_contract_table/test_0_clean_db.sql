BEGIN;

DELETE FROM contract;
DELETE FROM client;
DELETE FROM manager;

INSERT INTO manager (id, email, name, password)
VALUES (1, 'manager_contract@test.com', 'Manager', 'pass');

INSERT INTO client (id, email, name, password)
VALUES (1, 'client_contract@test.com', 'Client', 'pass');

COMMIT;
