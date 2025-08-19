-- Drop password_resets table and clean up references
-- This migration removes the deprecated password_resets table since OTP functionality
-- has been moved to the otp_verifications table

-- Drop any existing policies for password_resets table
DROP POLICY IF EXISTS "Allow password reset access" ON public.password_resets;
DROP POLICY IF EXISTS "Allow all operations on password resets for authenticated users" ON public.password_resets;

-- Drop the password_resets table if it exists
DROP TABLE IF EXISTS public.password_resets CASCADE;

-- Add comment explaining the removal
COMMENT ON TABLE public.otp_verifications IS 'OTP verifications table - replaces the deprecated password_resets table for OTP functionality';