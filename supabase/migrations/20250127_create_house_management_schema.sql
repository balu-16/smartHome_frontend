-- Create House Management Schema
-- This migration creates the hierarchical structure: Users -> Houses -> Rooms -> Switches -> Electronic Objects

-- Create houses table
CREATE TABLE public.houses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.signup_users(id) ON DELETE CASCADE,
    house_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms table (linked to houses)
CREATE TABLE public.rooms (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    room_name TEXT NOT NULL,
    room_type TEXT, -- e.g., 'bedroom', 'kitchen', 'living_room', 'bathroom'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Electronic Objects table (defines what can be controlled)
CREATE TABLE public.electronic_objects (
    id SERIAL PRIMARY KEY,
    object_name TEXT NOT NULL, -- e.g., 'LED Light', 'Fan', 'AC', 'TV'
    object_type TEXT NOT NULL, -- e.g., 'light', 'fan', 'appliance'
    icon_name TEXT DEFAULT 'device', -- for UI display
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Switches table (linked to rooms and electronic objects)
CREATE TABLE public.switches (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    electronic_object_id INTEGER NOT NULL REFERENCES public.electronic_objects(id) ON DELETE CASCADE,
    switch_name TEXT NOT NULL, -- custom name given by user
    switch_label TEXT, -- additional label/description
    is_active BOOLEAN DEFAULT true,
    position_x INTEGER DEFAULT 0, -- for UI positioning if needed
    position_y INTEGER DEFAULT 0, -- for UI positioning if needed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_houses_user_id ON public.houses(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_house_id ON public.rooms(house_id);
CREATE INDEX IF NOT EXISTS idx_switches_room_id ON public.switches(room_id);
CREATE INDEX IF NOT EXISTS idx_switches_electronic_object_id ON public.switches(electronic_object_id);

-- Add comments for documentation
COMMENT ON TABLE public.houses IS 'Houses owned by users for home automation';
COMMENT ON TABLE public.rooms IS 'Rooms within houses';
COMMENT ON TABLE public.electronic_objects IS 'Types of electronic objects that can be controlled';
COMMENT ON TABLE public.switches IS 'Virtual switches that control electronic objects in rooms';

-- Enable Row Level Security (RLS)
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electronic_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.switches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Houses: Users can only see their own houses
CREATE POLICY "Users can view their own houses" ON public.houses
    FOR SELECT USING (user_id = auth.uid()::int);

CREATE POLICY "Users can insert their own houses" ON public.houses
    FOR INSERT WITH CHECK (user_id = auth.uid()::int);

CREATE POLICY "Users can update their own houses" ON public.houses
    FOR UPDATE USING (user_id = auth.uid()::int);

CREATE POLICY "Users can delete their own houses" ON public.houses
    FOR DELETE USING (user_id = auth.uid()::int);

-- Rooms: Users can only see rooms in their houses
CREATE POLICY "Users can view rooms in their houses" ON public.rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.houses 
            WHERE houses.id = rooms.house_id 
            AND houses.user_id = auth.uid()::int
        )
    );

CREATE POLICY "Users can insert rooms in their houses" ON public.rooms
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.houses 
            WHERE houses.id = rooms.house_id 
            AND houses.user_id = auth.uid()::int
        )
    );

CREATE POLICY "Users can update rooms in their houses" ON public.rooms
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.houses 
            WHERE houses.id = rooms.house_id 
            AND houses.user_id = auth.uid()::int
        )
    );

CREATE POLICY "Users can delete rooms in their houses" ON public.rooms
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.houses 
            WHERE houses.id = rooms.house_id 
            AND houses.user_id = auth.uid()::int
        )
    );

-- Electronic Objects: Allow all authenticated users to read (for selection)
CREATE POLICY "Allow authenticated users to read electronic objects" ON public.electronic_objects
    FOR SELECT TO authenticated USING (true);

-- Switches: Users can only manage switches in their rooms
CREATE POLICY "Users can view switches in their rooms" ON public.switches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.rooms 
            JOIN public.houses ON houses.id = rooms.house_id
            WHERE rooms.id = switches.room_id 
            AND houses.user_id = auth.uid()::int
        )
    );

CREATE POLICY "Users can insert switches in their rooms" ON public.switches
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.rooms 
            JOIN public.houses ON houses.id = rooms.house_id
            WHERE rooms.id = switches.room_id 
            AND houses.user_id = auth.uid()::int
        )
    );

CREATE POLICY "Users can update switches in their rooms" ON public.switches
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.rooms 
            JOIN public.houses ON houses.id = rooms.house_id
            WHERE rooms.id = switches.room_id 
            AND houses.user_id = auth.uid()::int
        )
    );

CREATE POLICY "Users can delete switches in their rooms" ON public.switches
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.rooms 
            JOIN public.houses ON houses.id = rooms.house_id
            WHERE rooms.id = switches.room_id 
            AND houses.user_id = auth.uid()::int
        )
    );