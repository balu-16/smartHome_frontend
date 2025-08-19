-- Add house_id and room_id columns to devices table to link devices with houses and rooms
-- This allows devices to be associated with specific locations in the house management system

-- Add house_id column with foreign key reference
ALTER TABLE public.devices 
ADD COLUMN house_id INTEGER REFERENCES public.houses(id) ON DELETE SET NULL;

-- Add room_id column with foreign key reference
ALTER TABLE public.devices 
ADD COLUMN room_id INTEGER REFERENCES public.rooms(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_house_id ON public.devices(house_id);
CREATE INDEX IF NOT EXISTS idx_devices_room_id ON public.devices(room_id);

-- Add comments for documentation
COMMENT ON COLUMN public.devices.house_id IS 'ID of the house where this device is located';
COMMENT ON COLUMN public.devices.room_id IS 'ID of the room where this device is located';

-- Note: These columns are nullable to maintain compatibility with existing devices
-- Devices allocated before the house management system will have NULL values
-- New devices should be allocated with both house_id and room_id specified