-- TEST_NAME: valid status
-- EXPECTED: SUCCESS
INSERT INTO contract (id, status, client_id)
VALUES
    (3, 'SEND_TO_CLIENT', 1),
    (4, 'ACTIVE', 1),
    (5, 'OUTDATED', 1);