BEGIN;

DELETE FROM contract;
DELETE FROM device_change_task;
DELETE FROM device_metric;
DELETE FROM device;
DELETE FROM punishment_task;
DELETE FROM time_interval;
DELETE FROM monitoring_interval;
DELETE FROM reset_token;
DELETE FROM file;
DELETE FROM notification;
DELETE FROM client;
DELETE FROM worker;
DELETE FROM manager;

INSERT INTO manager (id, email, name, password)
VALUES (1, 'manager_contract@test.com', 'Manager', 'pass');

INSERT INTO client (id, email, name, password)
VALUES (1, 'client_contract@test.com', 'Client', 'pass');

COMMIT;
