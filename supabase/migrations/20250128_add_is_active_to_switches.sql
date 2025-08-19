-- Add is_active column to switches table for device state management
ALTER TABLE switches ADD COLUMN is_active BOOLEAN DEFAULT false;

-- Update existing switches to be inactive by default
UPDATE switches SET is_active = false WHERE is_active IS NULL;