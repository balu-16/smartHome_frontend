-- Migration: Update device_m2m_number to support 13 digits
-- Date: 2025-01-17
-- Description: Drop existing device_m2m_number column and recreate with 13-digit validation

-- Step 1: Drop the existing column
ALTER TABLE public.devices
DROP COLUMN IF EXISTS device_m2m_number;

-- Step 2: Add the new column with 13-digit validation
ALTER TABLE public.devices
ADD COLUMN device_m2m_number VARCHAR(13)
CHECK (
  device_m2m_number IS NULL OR
  (length(device_m2m_number) = 13 AND device_m2m_number ~ '^[0-9]{13}$')
);

-- Add comment for documentation
COMMENT ON COLUMN public.devices.device_m2m_number IS 'Device M2M number - must be exactly 13 digits';