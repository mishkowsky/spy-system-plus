SELECT DISTINCT c.*
FROM client c
INNER JOIN contract ct ON ct.client_id = c.id
WHERE ct.signer_id = 1
  AND c.deleted_at IS NULL;
