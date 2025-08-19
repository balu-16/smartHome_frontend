-- Insert Sample Data for House Management System
-- This migration provides example data for testing the new hierarchical structure

-- First, insert common electronic objects that users can choose from
INSERT INTO public.electronic_objects (object_name, object_type, icon_name) VALUES
('LED Light', 'light', 'lightbulb'),
('Ceiling Fan', 'fan', 'fan'),
('Air Conditioner', 'appliance', 'snowflake'),
('Television', 'appliance', 'tv'),
('Smart Speaker', 'appliance', 'speaker'),
('Table Lamp', 'light', 'lamp'),
('Exhaust Fan', 'fan', 'fan'),
('Heater', 'appliance', 'fire'),
('Smart Plug', 'outlet', 'plug'),
('Security Camera', 'security', 'camera'),
('Door Lock', 'security', 'lock'),
('Window Blinds', 'automation', 'window');

-- Sample data assumes we have at least one user in signup_users table
-- Insert sample houses for user_id = 1
INSERT INTO public.houses (user_id, house_name) VALUES
(1, 'Main House'),
(1, 'Guest House');

-- Get the house IDs for reference (assuming they will be 1 and 2)
-- Insert rooms for Main House (house_id = 1)
INSERT INTO public.rooms (house_id, room_name, room_type, description) VALUES
-- Main House rooms
(1, 'Living Room', 'living_room', 'Main family gathering area'),
(1, 'Master Bedroom', 'bedroom', 'Primary bedroom with ensuite'),
(1, 'Kitchen', 'kitchen', 'Modern kitchen with smart appliances'),
(1, 'Guest Bedroom', 'bedroom', 'Comfortable room for guests'),
(1, 'Home Office', 'office', 'Work from home space'),
-- Guest House rooms
(2, 'Studio Room', 'studio', 'Open plan living space'),
(2, 'Kitchenette', 'kitchen', 'Small kitchen area'),
(2, 'Bathroom', 'bathroom', 'Compact bathroom');

-- Insert switches for each room
-- Living Room switches (room_id = 1)
INSERT INTO public.switches (room_id, electronic_object_id, switch_name, switch_label) VALUES
(1, 1, 'Main Lights', 'Ceiling LED lights'),
(1, 2, 'Ceiling Fan', 'Living room ceiling fan'),
(1, 4, 'TV', '65 inch Smart TV'),
(1, 5, 'Smart Speaker', 'Amazon Echo');

-- Master Bedroom switches (room_id = 2)
INSERT INTO public.switches (room_id, electronic_object_id, switch_name, switch_label) VALUES
(2, 1, 'Bedroom Lights', 'Main bedroom lighting'),
(2, 6, 'Bedside Lamp', 'Reading lamp'),
(2, 2, 'Bedroom Fan', 'Ceiling fan'),
(2, 3, 'AC Unit', 'Master bedroom AC');

-- Kitchen switches (room_id = 3)
INSERT INTO public.switches (room_id, electronic_object_id, switch_name, switch_label) VALUES
(3, 1, 'Kitchen Lights', 'Under cabinet and ceiling lights'),
(3, 7, 'Exhaust Fan', 'Kitchen ventilation'),
(3, 9, 'Coffee Maker', 'Smart coffee maker plug');

-- Guest Bedroom switches (room_id = 4)
INSERT INTO public.switches (room_id, electronic_object_id, switch_name, switch_label) VALUES
(4, 1, 'Guest Lights', 'Guest room lighting'),
(4, 6, 'Table Lamp', 'Bedside reading lamp'),
(4, 2, 'Guest Fan', 'Ceiling fan for guests');

-- Home Office switches (room_id = 5)
INSERT INTO public.switches (room_id, electronic_object_id, switch_name, switch_label) VALUES
(5, 1, 'Office Lights', 'Desk and overhead lighting'),
(5, 9, 'Desk Setup', 'Computer and monitor power'),
(5, 8, 'Space Heater', 'Portable heater for winter');

-- Guest House - Studio Room switches (room_id = 6)
INSERT INTO public.switches (room_id, electronic_object_id, switch_name, switch_label) VALUES
(6, 1, 'Studio Lights', 'Main studio lighting'),
(6, 4, 'Guest TV', 'Small TV for guests'),
(6, 3, 'Portable AC', 'Window AC unit');

-- Guest House - Kitchenette switches (room_id = 7)
INSERT INTO public.switches (room_id, electronic_object_id, switch_name, switch_label) VALUES
(7, 1, 'Kitchenette Lights', 'Small kitchen lighting'),
(7, 9, 'Mini Fridge', 'Compact refrigerator');

-- Guest House - Bathroom switches (room_id = 8)
INSERT INTO public.switches (room_id, electronic_object_id, switch_name, switch_label) VALUES
(8, 1, 'Bathroom Lights', 'Bathroom lighting'),
(8, 7, 'Bathroom Fan', 'Ventilation fan'),
(8, 8, 'Towel Warmer', 'Electric towel warmer');

-- Add some sample data for a second user (assuming user_id 2 exists)
INSERT INTO public.houses (user_id, house_name) VALUES
(2, 'Downtown Apartment');

-- Apartment rooms (house_id = 3)
INSERT INTO public.rooms (house_id, room_name, room_type, description) VALUES
(3, 'Living Area', 'living_room', 'Open plan living and dining'),
(3, 'Bedroom', 'bedroom', 'Single bedroom'),
(3, 'Kitchen', 'kitchen', 'Galley kitchen');

-- Apartment switches
-- Living Area switches (room_id = 9)
INSERT INTO public.switches (room_id, electronic_object_id, switch_name, switch_label) VALUES
(9, 1, 'Living Lights', 'Track lighting'),
(9, 4, 'Wall TV', 'Mounted smart TV'),
(9, 5, 'Sound System', 'Bluetooth speaker');

-- Apartment Bedroom switches (room_id = 10)
INSERT INTO public.switches (room_id, electronic_object_id, switch_name, switch_label) VALUES
(10, 1, 'Bedroom Lights', 'Pendant lights'),
(10, 3, 'Window AC', 'Air conditioning unit');

-- Apartment Kitchen switches (room_id = 11)
INSERT INTO public.switches (room_id, electronic_object_id, switch_name, switch_label) VALUES
(11, 1, 'Kitchen Lights', 'Under cabinet LEDs'),
(11, 9, 'Microwave', 'Countertop microwave');