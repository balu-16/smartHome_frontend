-- Add room_type and description columns to rooms table
ALTER TABLE rooms 
  ADD COLUMN room_type VARCHAR(50), 
  ADD COLUMN description TEXT NULL;

-- Add comment for documentation
COMMENT ON COLUMN rooms.room_type IS 'Type of room (e.g., bedroom, kitchen, living room, etc.)';
COMMENT ON COLUMN rooms.description IS 'Optional description of the room';