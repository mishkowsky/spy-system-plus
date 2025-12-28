-- TEST_NAME: full valid insert
-- EXPECTED: SUCCESS
INSERT INTO monitoring_interval (
    id, begin, ending, weekday, client_id, worker_id
)
VALUES (
    2,
    '08:00',
    '16:00',
    'FRIDAY',
    1,
    1
);