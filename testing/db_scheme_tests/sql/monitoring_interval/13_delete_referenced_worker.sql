-- TEST_NAME: delete referenced worker
-- EXPECTED: ERROR
DELETE FROM worker WHERE id = 1;