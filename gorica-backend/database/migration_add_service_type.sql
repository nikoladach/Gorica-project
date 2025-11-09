-- Migration: Add service_type field to appointments table
-- This allows differentiating between Doctor and Esthetician appointments

-- Add the column first
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS service_type VARCHAR(20) DEFAULT 'doctor';

-- Add the check constraint separately
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'appointments_service_type_check'
    ) THEN
        ALTER TABLE appointments 
        ADD CONSTRAINT appointments_service_type_check 
        CHECK (service_type IN ('doctor', 'esthetician'));
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_service_type ON appointments(service_type);

-- Update existing appointments to have 'doctor' as default
UPDATE appointments SET service_type = 'doctor' WHERE service_type IS NULL;

