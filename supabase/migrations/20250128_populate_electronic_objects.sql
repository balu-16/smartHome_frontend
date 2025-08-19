-- Populate electronic_objects table with common electronic gadgets
-- This migration adds various electronic devices that can be controlled remotely

-- Insert electronic objects with their types and icons
INSERT INTO public.electronic_objects (object_name, object_type, icon_name) VALUES
-- Lighting
('LED Light', 'light', 'lightbulb'),
('Ceiling Fan Light', 'light', 'lightbulb'),
('Table Lamp', 'light', 'lamp'),
('Floor Lamp', 'light', 'lamp'),
('Strip Light', 'light', 'lightbulb'),
('Smart Bulb', 'light', 'lightbulb'),

-- Fans
('Ceiling Fan', 'fan', 'fan'),
('Exhaust Fan', 'fan', 'fan'),
('Table Fan', 'fan', 'fan'),
('Tower Fan', 'fan', 'fan'),

-- Air Conditioning
('Air Conditioner', 'appliance', 'snowflake'),
('Window AC', 'appliance', 'snowflake'),
('Split AC', 'appliance', 'snowflake'),

-- Entertainment
('Television', 'entertainment', 'tv'),
('Smart TV', 'entertainment', 'tv'),
('Sound System', 'entertainment', 'speaker'),
('Home Theater', 'entertainment', 'speaker'),
('Music Player', 'entertainment', 'music'),

-- Kitchen Appliances
('Microwave', 'appliance', 'microwave'),
('Refrigerator', 'appliance', 'refrigerator'),
('Dishwasher', 'appliance', 'dishwasher'),
('Coffee Maker', 'appliance', 'coffee'),
('Toaster', 'appliance', 'toaster'),
('Blender', 'appliance', 'blender'),
('Rice Cooker', 'appliance', 'rice-cooker'),

-- Heating
('Water Heater', 'appliance', 'water-heater'),
('Room Heater', 'appliance', 'heater'),
('Electric Fireplace', 'appliance', 'fireplace'),

-- Security & Monitoring
('Security Camera', 'security', 'camera'),
('Door Lock', 'security', 'lock'),
('Motion Sensor', 'security', 'sensor'),
('Smoke Detector', 'security', 'smoke-detector'),

-- Smart Home
('Smart Plug', 'smart', 'plug'),
('Smart Switch', 'smart', 'switch'),
('Smart Thermostat', 'smart', 'thermostat'),
('Smart Doorbell', 'smart', 'doorbell'),

-- Cleaning
('Vacuum Cleaner', 'appliance', 'vacuum'),
('Robot Vacuum', 'appliance', 'robot-vacuum'),
('Air Purifier', 'appliance', 'air-purifier'),

-- Laundry
('Washing Machine', 'appliance', 'washing-machine'),
('Dryer', 'appliance', 'dryer'),
('Iron', 'appliance', 'iron'),

-- Outdoor
('Garden Light', 'light', 'outdoor-light'),
('Pool Pump', 'appliance', 'pool-pump'),
('Sprinkler System', 'appliance', 'sprinkler'),

-- Miscellaneous
('Humidifier', 'appliance', 'humidifier'),
('Dehumidifier', 'appliance', 'dehumidifier'),
('Electric Kettle', 'appliance', 'kettle'),
('Garage Door', 'appliance', 'garage-door')

ON CONFLICT (object_name) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE public.electronic_objects IS 'Catalog of electronic devices that can be controlled remotely through the home automation system';