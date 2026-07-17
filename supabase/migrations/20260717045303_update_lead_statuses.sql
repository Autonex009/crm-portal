-- 1. Drop the old constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- 2. Migrate existing staging data so it complies with the new constraint
UPDATE leads SET status = 'initial count' WHERE status = 'contacted';
UPDATE leads SET status = 'call scheduled' WHERE status = 'qualified';
UPDATE leads SET status = 'not interested' WHERE status = 'lost';

-- 3. Enforce the new constraint
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
CHECK (status IN (
  'new', 
  'initial count', 
  'deck sent', 
  'not interested', 
  'call scheduled', 
  'call done', 
  'proposal sent', 
  'closed'
));
