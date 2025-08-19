# House Management Schema Documentation

## Overview

This document describes the new hierarchical house management system that replaces the GPS device tracking feature. The new system allows users to manage their homes through a structured hierarchy: **Users → Houses → Rooms → Switches → Electronic Objects**.

## Schema Design

### Database Tables

#### 1. Houses Table
```sql
CREATE TABLE public.houses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.signup_users(id) ON DELETE CASCADE,
    house_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. Rooms Table
```sql
CREATE TABLE public.rooms (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    room_name TEXT NOT NULL,
    room_type TEXT, -- e.g., 'bedroom', 'kitchen', 'living_room', 'bathroom'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. Electronic Objects Table
```sql
CREATE TABLE public.electronic_objects (
    id SERIAL PRIMARY KEY,
    object_name TEXT NOT NULL, -- e.g., 'LED Light', 'Fan', 'AC', 'TV'
    object_type TEXT NOT NULL, -- e.g., 'light', 'fan', 'appliance'
    icon_name TEXT DEFAULT 'device', -- for UI display
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. Switches Table
```sql
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
```

## Foreign Key Relationships

- `houses.user_id` → `signup_users.id` (CASCADE DELETE)
- `rooms.house_id` → `houses.id` (CASCADE DELETE)
- `switches.room_id` → `rooms.id` (CASCADE DELETE)
- `switches.electronic_object_id` → `electronic_objects.id` (CASCADE DELETE)

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **Houses**: Users can only access their own houses
- **Rooms**: Users can only access rooms in their houses
- **Electronic Objects**: All authenticated users can read (for selection)
- **Switches**: Users can only manage switches in their rooms

## Sample Data Structure

### Electronic Objects (Pre-populated)
```sql
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
```

### Example User Data
```sql
-- Houses for user_id = 1
INSERT INTO public.houses (user_id, house_name) VALUES
(1, 'Main House'),
(1, 'Guest House');

-- Rooms for Main House
INSERT INTO public.rooms (house_id, room_name, room_type, description) VALUES
(1, 'Living Room', 'living_room', 'Main family gathering area'),
(1, 'Master Bedroom', 'bedroom', 'Primary bedroom with ensuite'),
(1, 'Kitchen', 'kitchen', 'Modern kitchen with smart appliances');

-- Switches for Living Room
INSERT INTO public.switches (room_id, electronic_object_id, switch_name, switch_label) VALUES
(1, 1, 'Main Lights', 'Ceiling LED lights'),
(1, 2, 'Ceiling Fan', 'Living room ceiling fan'),
(1, 4, 'TV', '65 inch Smart TV');
```

## API Usage Examples

### TypeScript Types
The following types are available in `src/integrations/supabase/types.ts`:

```typescript
// Get user's houses
type House = Database['public']['Tables']['houses']['Row'];
type HouseInsert = Database['public']['Tables']['houses']['Insert'];
type HouseUpdate = Database['public']['Tables']['houses']['Update'];

// Get rooms in a house
type Room = Database['public']['Tables']['rooms']['Row'];
type RoomInsert = Database['public']['Tables']['rooms']['Insert'];
type RoomUpdate = Database['public']['Tables']['rooms']['Update'];

// Get available electronic objects
type ElectronicObject = Database['public']['Tables']['electronic_objects']['Row'];

// Get switches in a room
type Switch = Database['public']['Tables']['switches']['Row'];
type SwitchInsert = Database['public']['Tables']['switches']['Insert'];
type SwitchUpdate = Database['public']['Tables']['switches']['Update'];
```

### Common Queries

#### Get User's Houses
```typescript
const { data: houses } = await supabase
  .from('houses')
  .select('*')
  .eq('user_id', userId);
```

#### Get Rooms in a House
```typescript
const { data: rooms } = await supabase
  .from('rooms')
  .select('*')
  .eq('house_id', houseId);
```

#### Get Switches in a Room with Electronic Object Details
```typescript
const { data: switches } = await supabase
  .from('switches')
  .select(`
    *,
    electronic_objects (
      id,
      object_name,
      object_type,
      icon_name
    )
  `)
  .eq('room_id', roomId);
```

#### Get All Electronic Objects for Selection
```typescript
const { data: objects } = await supabase
  .from('electronic_objects')
  .select('*')
  .order('object_type', { ascending: true });
```

#### Create a New House
```typescript
const { data: house } = await supabase
  .from('houses')
  .insert({
    user_id: userId,
    house_name: 'My New House'
  })
  .select()
  .single();
```

#### Create a New Room
```typescript
const { data: room } = await supabase
  .from('rooms')
  .insert({
    house_id: houseId,
    room_name: 'Living Room',
    room_type: 'living_room',
    description: 'Main gathering area'
  })
  .select()
  .single();
```

#### Create a New Switch
```typescript
const { data: switch } = await supabase
  .from('switches')
  .insert({
    room_id: roomId,
    electronic_object_id: objectId,
    switch_name: 'Main Light',
    switch_label: 'Ceiling LED lights'
  })
  .select()
  .single();
```

## UI Implementation Notes

1. **House Management**: Users can add/edit/delete houses
2. **Room Management**: Users can add/edit/delete rooms within their houses
3. **Switch Management**: Users can add switches by selecting from available electronic objects
4. **Object Selection**: Provide a dropdown/picker with pre-defined electronic objects
5. **Hierarchical Navigation**: Implement breadcrumb navigation (House → Room → Switches)
6. **Icons**: Use the `icon_name` field from electronic_objects for consistent UI icons

## Migration Files

1. `20250127_create_house_management_schema.sql` - Creates all tables and RLS policies
2. `20250127_insert_sample_house_data.sql` - Inserts sample data for testing

## Security Considerations

- All tables use Row Level Security (RLS)
- Users can only access their own data
- Cascade deletes ensure data integrity
- Electronic objects are shared across all users (read-only)

## Future Enhancements

- Add switch state tracking (on/off)
- Implement switch scheduling
- Add room layouts with switch positioning
- Support for custom electronic object types
- Integration with actual IoT devices