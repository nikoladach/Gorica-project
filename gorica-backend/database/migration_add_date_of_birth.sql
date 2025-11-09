-- Migration: Add date_of_birth field to physician_reports table

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'physician_reports') THEN
        -- Add column if table exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'physician_reports' AND column_name = 'date_of_birth'
        ) THEN
            ALTER TABLE physician_reports
            ADD COLUMN date_of_birth DATE;
        END IF;
        
        -- Create index for better query performance
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_physician_reports_date_of_birth'
        ) THEN
            CREATE INDEX idx_physician_reports_date_of_birth ON physician_reports(date_of_birth);
        END IF;
    END IF;
END $$;

