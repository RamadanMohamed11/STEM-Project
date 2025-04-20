-- Update the projects table to support multiple categories
DO $$ 
BEGIN
    -- First check if the column exists and is a string type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'category'
        AND data_type = 'character varying'
    ) THEN
        -- Rename the existing column to avoid conflicts
        ALTER TABLE projects RENAME COLUMN category TO category_old;
        
        -- Add the new categories array column
        ALTER TABLE projects ADD COLUMN categories TEXT[] DEFAULT '{}';
        
        -- Migrate data from the old column to the new array column
        UPDATE projects SET categories = ARRAY[category_old] WHERE category_old IS NOT NULL;
        
        -- Drop the old column
        ALTER TABLE projects DROP COLUMN category_old;
    
    -- If the column doesn't exist yet, just add the array column
    ELSIF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'categories'
    ) THEN
        ALTER TABLE projects ADD COLUMN categories TEXT[] DEFAULT '{}';
    END IF;
END $$;
