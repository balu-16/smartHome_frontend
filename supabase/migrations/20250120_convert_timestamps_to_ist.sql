-- Convert all timestamp columns from UTC to Indian Standard Time (IST)
-- This migration updates all existing timestamp columns and their defaults

-- 1. Update gps_data table
-- Convert existing timestamps to IST
UPDATE public.gps_data 
SET timestamp = timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE timestamp IS NOT NULL;

-- Update default for future inserts
ALTER TABLE public.gps_data 
ALTER COLUMN timestamp SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');

-- 2. Update otp_verifications table
-- Convert existing timestamps to IST
UPDATE public.otp_verifications 
SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
    expires_at = expires_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE created_at IS NOT NULL;

-- Update defaults for future inserts
ALTER TABLE public.otp_verifications 
ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');

-- Update the expires_at calculation function to use IST
CREATE OR REPLACE FUNCTION set_otp_expires_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expires_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata') + INTERVAL '10 minutes';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set expires_at in IST
DROP TRIGGER IF EXISTS trigger_set_otp_expires_at ON public.otp_verifications;
CREATE TRIGGER trigger_set_otp_expires_at
    BEFORE INSERT ON public.otp_verifications
    FOR EACH ROW
    EXECUTE FUNCTION set_otp_expires_at();

-- 3. Update employee_login_logs table
-- Convert existing timestamps to IST
UPDATE public.employee_login_logs 
SET login_time = login_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE login_time IS NOT NULL;

-- Update default for future inserts
ALTER TABLE public.employee_login_logs 
ALTER COLUMN login_time SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');

-- 4. Update devices table (allocated_at column)
-- Convert existing timestamps to IST
UPDATE public.devices 
SET allocated_at = allocated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE allocated_at IS NOT NULL OR created_at IS NOT NULL;

-- Update default for created_at if it exists
ALTER TABLE public.devices 
ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');

-- 5. Update signup_users table if it has timestamp columns
-- Check if created_at column exists and update it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'signup_users' AND column_name = 'created_at') THEN
        
        -- Convert existing timestamps to IST
        UPDATE public.signup_users 
        SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
        WHERE created_at IS NOT NULL;
        
        -- Update default for future inserts
        ALTER TABLE public.signup_users 
        ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
    END IF;
END $$;

-- 6. Update super_admins table if it has timestamp columns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'super_admins' AND column_name = 'created_at') THEN
        
        -- Convert existing timestamps to IST
        UPDATE public.super_admins 
        SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
        WHERE created_at IS NOT NULL;
        
        -- Update default for future inserts
        ALTER TABLE public.super_admins 
        ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
    END IF;
END $$;

-- 7. Update device_shared_with table if it has timestamp columns
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'device_shared_with' AND column_name = 'shared_at') THEN
        
        -- Convert existing timestamps to IST
        UPDATE public.device_shared_with 
        SET shared_at = shared_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
        WHERE shared_at IS NOT NULL;
        
        -- Update default for future inserts
        ALTER TABLE public.device_shared_with 
        ALTER COLUMN shared_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
    END IF;
END $$;

-- 8. Update the cleanup function to use IST
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.otp_verifications 
    WHERE expires_at < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
    AND is_verified = false;
END;
$$;

-- Add comments to document the timezone change
COMMENT ON TABLE public.gps_data IS 'GPS tracking data with timestamps stored in Indian Standard Time (IST)';
COMMENT ON TABLE public.otp_verifications IS 'OTP verification records with timestamps stored in Indian Standard Time (IST)';
COMMENT ON TABLE public.employee_login_logs IS 'Employee login activity logs with timestamps stored in Indian Standard Time (IST)';

-- Create a function to get current IST timestamp for application use
CREATE OR REPLACE FUNCTION current_ist_timestamp()
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE sql
AS $$
    SELECT CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
$$;

COMMENT ON FUNCTION current_ist_timestamp() IS 'Returns current timestamp in Indian Standard Time (IST) for application use';