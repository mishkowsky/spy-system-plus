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
VALUES (1, 'manager_mi@test.com', 'Manager', 'pass');

INSERT INTO worker (id, email, name, password, role, manager_id)
VALUES (1, 'worker_mi@test.com', 'Worker', 'pass', 'SURVEILLANCE_OFFICER', 1);

INSERT INTO client (id, email, name, password)
VALUES (1, 'client_mi@test.com', 'Client', 'pass');

COMMIT;