-- Migration: Add Physician Reports Table
-- This table stores physician reports/notes for appointments

CREATE TABLE IF NOT EXISTS physician_reports (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    patient_name VARCHAR(200) NOT NULL,
    reason_for_visit TEXT,
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    physical_examination TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    medications_prescribed TEXT,
    follow_up_instructions TEXT,
    additional_notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(appointment_id)
);

-- Create indexes for better query performance
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'physician_reports') THEN
        CREATE INDEX IF NOT EXISTS idx_physician_reports_appointment ON physician_reports(appointment_id);
        CREATE INDEX IF NOT EXISTS idx_physician_reports_created_by ON physician_reports(created_by);
        CREATE INDEX IF NOT EXISTS idx_physician_reports_created_at ON physician_reports(created_at);
    END IF;
END $$;

-- Create trigger to automatically update updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'physician_reports') THEN
        IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_physician_reports_updated_at') THEN
            DROP TRIGGER update_physician_reports_updated_at ON physician_reports;
        END IF;
        CREATE TRIGGER update_physician_reports_updated_at BEFORE UPDATE ON physician_reports
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

