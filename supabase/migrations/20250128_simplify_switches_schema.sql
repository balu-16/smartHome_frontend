-- Simplify switches table by adding electronic_object column directly
-- This removes the need for a separate electronic_objects table and foreign key relationship

-- Drop the foreign key constraint and electronic_object_id column if they exist
ALTER TABLE switches DROP CONSTRAINT IF EXISTS switches_electronic_object_id_fkey;
ALTER TABLE switches DROP COLUMN IF EXISTS electronic_object_id;

-- Add electronic_object column to store the device type directly
ALTER TABLE switches 
ADD COLUMN electronic_object VARCHAR(100) NOT NULL DEFAULT 'Smart Switch';

-- Drop the electronic_objects table if it exists since we're not using it
DROP TABLE IF EXISTS electronic_objects CASCADE;

-- Add comment for documentation
COMMENT ON COLUMN switches.electronic_object IS 'Type of electronic device controlled by this switch (e.g., LED Light, Ceiling Fan, Air Conditioner, etc.)';