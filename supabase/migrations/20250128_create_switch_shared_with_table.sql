-- Create switch_shared_with table to track switch sharing
CREATE TABLE public.switch_shared_with (
    id SERIAL PRIMARY KEY,
    switch_id INT REFERENCES public.switches(id) ON DELETE CASCADE,
    shared_with_user_id INT NOT NULL,
    shared_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key reference to signup_users table
ALTER TABLE public.switch_shared_with 
ADD CONSTRAINT fk_switch_shared_with_user 
FOREIGN KEY (shared_with_user_id) REFERENCES public.signup_users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_switch_shared_with_switch_id ON public.switch_shared_with(switch_id);
CREATE INDEX IF NOT EXISTS idx_switch_shared_with_user_id ON public.switch_shared_with(shared_with_user_id);

-- Add comments to the table and columns
COMMENT ON TABLE public.switch_shared_with IS 'Stores information about switches shared between users';
COMMENT ON COLUMN public.switch_shared_with.switch_id IS 'ID of the switch being shared';
COMMENT ON COLUMN public.switch_shared_with.shared_with_user_id IS 'ID of the user the switch is shared with';
COMMENT ON COLUMN public.switch_shared_with.shared_at IS 'Timestamp when the switch was shared';

-- Enable Row Level Security (RLS)
ALTER TABLE public.switch_shared_with ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can view switches shared with them
CREATE POLICY "Users can view switches shared with them" ON public.switch_shared_with
    FOR SELECT USING (shared_with_user_id = auth.uid()::int);

-- Switch owners can share their switches
CREATE POLICY "Switch owners can share their switches" ON public.switch_shared_with
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.switches 
            JOIN public.rooms ON rooms.id = switches.room_id
            JOIN public.houses ON houses.id = rooms.house_id
            WHERE switches.id = switch_shared_with.switch_id 
            AND houses.user_id = auth.uid()::int
        )
    );

-- Switch owners can remove sharing
CREATE POLICY "Switch owners can remove sharing" ON public.switch_shared_with
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.switches 
            JOIN public.rooms ON rooms.id = switches.room_id
            JOIN public.houses ON houses.id = rooms.house_id
            WHERE switches.id = switch_shared_with.switch_id 
            AND houses.user_id = auth.uid()::int
        )
    );

-- Switch owners can view their shared switches
CREATE POLICY "Switch owners can view their shared switches" ON public.switch_shared_with
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.switches 
            JOIN public.rooms ON rooms.id = switches.room_id
            JOIN public.houses ON houses.id = rooms.house_id
            WHERE switches.id = switch_shared_with.switch_id 
            AND houses.user_id = auth.uid()::int
        )
    );