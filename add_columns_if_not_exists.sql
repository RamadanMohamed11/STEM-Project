-- Safe migration script that checks if columns exist before adding them
DO $$
BEGIN
    -- Check if started_early column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'smart_goals' AND column_name = 'started_early'
    ) THEN
        -- Add started_early column if it doesn't exist
        ALTER TABLE smart_goals
        ADD COLUMN started_early BOOLEAN DEFAULT FALSE;
        
        -- Update existing records
        UPDATE smart_goals
        SET started_early = FALSE
        WHERE started_early IS NULL;
    END IF;

    -- Check if postponed column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'smart_goals' AND column_name = 'postponed'
    ) THEN
        -- Add postponed column if it doesn't exist
        ALTER TABLE smart_goals
        ADD COLUMN postponed BOOLEAN DEFAULT FALSE;
        
        -- Update existing records
        UPDATE smart_goals
        SET postponed = FALSE
        WHERE postponed IS NULL;
    END IF;
END
$$;
