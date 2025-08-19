-- Create device_shared_with table to track device sharing
CREATE TABLE public.device_shared_with (
    id SERIAL PRIMARY KEY,
    device_id INT REFERENCES public.devices(id) ON DELETE CASCADE,
    shared_with_user_id INT NOT NULL,
    shared_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key reference to signup_users table
ALTER TABLE public.device_shared_with 
ADD CONSTRAINT fk_device_shared_with_user 
FOREIGN KEY (shared_with_user_id) REFERENCES public.signup_users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_shared_with_device_id ON public.device_shared_with(device_id);
CREATE INDEX IF NOT EXISTS idx_device_shared_with_user_id ON public.device_shared_with(shared_with_user_id);

-- Add comments to the table and columns
COMMENT ON TABLE public.device_shared_with IS 'Stores information about devices shared between users';
COMMENT ON COLUMN public.device_shared_with.device_id IS 'ID of the device being shared';
COMMENT ON COLUMN public.device_shared_with.shared_with_user_id IS 'ID of the user the device is shared with';
COMMENT ON COLUMN public.device_shared_with.shared_at IS 'Timestamp when the device was shared';

-- Enable Row Level Security (RLS)
ALTER TABLE public.device_shared_with ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can view devices shared with them
CREATE POLICY "Users can view devices shared with them" ON public.device_shared_with
    FOR SELECT USING (shared_with_user_id = auth.uid()::int);

-- Device owners can share their devices
CREATE POLICY "Device owners can share their devices" ON public.device_shared_with
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.devices 
            WHERE devices.id = device_shared_with.device_id 
            AND devices.allocated_to_customer_id = auth.uid()::int
        )
    );

-- Device owners can remove sharing
CREATE POLICY "Device owners can remove sharing" ON public.device_shared_with
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.devices 
            WHERE devices.id = device_shared_with.device_id 
            AND devices.allocated_to_customer_id = auth.uid()::int
        )
    );