-- Add postponed column to smart_goals table (started_early already exists)
ALTER TABLE smart_goals
ADD COLUMN postponed BOOLEAN DEFAULT FALSE;

-- Update existing records to have postponed set to false
UPDATE smart_goals
SET postponed = FALSE
WHERE postponed IS NULL;
