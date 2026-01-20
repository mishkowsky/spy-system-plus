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

TRUNCATE TABLE
    device_metric,
    contract,
    client
RESTART IDENTITY

CASCADE;

ALTER SEQUENCE metric_sequence RESTART WITH 1;
ALTER SEQUENCE client_sequence RESTART WITH 1;
ALTER SEQUENCE contract_sequence RESTART WITH 1;

COMMIT;