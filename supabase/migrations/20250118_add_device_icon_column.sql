-- Add device_icon column to devices table
ALTER TABLE public.devices 
ADD COLUMN device_icon VARCHAR(50) DEFAULT 'car';

-- Add comment to the column
COMMENT ON COLUMN public.devices.device_icon IS 'Icon type selected by customer for their device marker on the map';

-- Create index on device_icon for faster searches (optional)
CREATE INDEX IF NOT EXISTS idx_devices_device_icon ON public.devices(device_icon);