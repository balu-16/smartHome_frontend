-- Add device_m2m_number column to devices table
ALTER TABLE public.devices 
ADD COLUMN device_m2m_number VARCHAR(12) DEFAULT NULL 
CHECK ( 
  device_m2m_number IS NULL OR 
  (length(device_m2m_number) = 12 AND device_m2m_number ~ '^[0-9]+$') 
);

-- Add comment to the column
COMMENT ON COLUMN public.devices.device_m2m_number IS 'M2M (Machine-to-Machine) number for the device. Must be exactly 12 digits if provided.';