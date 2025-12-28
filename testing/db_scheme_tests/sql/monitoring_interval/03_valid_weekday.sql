-- TEST_NAME: valid weekday
-- EXPECTED: SUCCESS
INSERT INTO monitoring_interval (id, weekday, client_id, worker_id)
VALUES
    (3, 'TUESDAY', 1, 1),
    (4, 'WEDNESDAY', 1, 1),
    (5, 'SATURDAY', 1, 1);
