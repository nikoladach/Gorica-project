-- Migration: Fix unique constraint to include service_type
-- This allows both doctor and esthetician to have appointments at the same time slot

-- Drop the old unique constraint that doesn't include service_type
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS unique_time_slot_per_day;

-- Create a new unique constraint that includes service_type
-- This allows the same time slot for different service types (doctor vs esthetician)
ALTER TABLE appointments 
ADD CONSTRAINT unique_time_slot_per_day_per_service 
UNIQUE (date, start_time, service_type);

