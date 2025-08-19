-- Remove GPS functionality from the database
-- This migration removes all GPS-related tables, policies, and constraints

-- Drop all GPS-related policies first
DROP POLICY IF EXISTS "Allow all users to view GPS data (testing)" ON gps_data;
DROP POLICY IF EXISTS "Customers can view their GPS data" ON gps_data;
DROP POLICY IF EXISTS "Customers can insert their GPS data" ON gps_data;
DROP POLICY IF EXISTS "Customers can view their device GPS data" ON gps_data;
DROP POLICY IF EXISTS "Admins can view all GPS data" ON gps_data;
DROP POLICY IF EXISTS "Allow IoT device data insertion" ON gps_data;

-- Drop indexes related to GPS data
DROP INDEX IF EXISTS idx_gps_data_user_id;
DROP INDEX IF EXISTS idx_gps_data_device_code;
DROP INDEX IF EXISTS idx_gps_data_timestamp;

-- Drop foreign key constraints
ALTER TABLE IF EXISTS gps_data DROP CONSTRAINT IF EXISTS fk_device_code;
ALTER TABLE IF EXISTS gps_data DROP CONSTRAINT IF EXISTS fk_gps_data_user_id;

-- Drop the GPS data table entirely
DROP TABLE IF EXISTS gps_data;

-- Remove any GPS-related functions or triggers if they exist
DROP FUNCTION IF EXISTS update_gps_data_user_id();
DROP TRIGGER IF EXISTS trigger_update_gps_data_user_id ON gps_data;

-- Comment: GPS functionality has been removed in favor of home automation and electronic object control
-- The system now focuses on controlling electronic devices rather than tracking GPS locations