import React, { useState, useEffect } from 'react';
import { Plus, DoorOpen, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { Tables } from '../integrations/supabase/types';

type Room = Tables<'rooms'>;
type House = Tables<'houses'>;

interface RoomListProps {
  house: House;
  onRoomSelect?: (room: Room) => void;
  onBackToHouses?: () => void;
  selectedRoomId?: number;
}

const ROOM_TYPES = [
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Dining Room',
  'Office',
  'Garage',
  'Basement',
  'Attic',
  'Laundry Room',
  'Guest Room',
  'Study',
  'Balcony',
  'Patio',
  'Other'
];

export const RoomList: React.FC<RoomListProps> = ({ 
  house, 
  onRoomSelect, 
  onBackToHouses,
  selectedRoomId 
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [newRoomType, setNewRoomType] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchRooms();
  }, [house.id]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('house_id', house.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch rooms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoomType.trim()) {
      toast({
        title: 'Error',
        description: 'Room type is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          house_id: house.id,
          room_type: newRoomType.trim(),
          description: newRoomDescription.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setRooms([...rooms, data]);
      resetForm();
      setIsAddDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Room added successfully',
      });
    } catch (error) {
      console.error('Error adding room:', error);
      toast({
        title: 'Error',
        description: 'Failed to add room',
        variant: 'destructive',
      });
    }
  };

  const handleEditRoom = async () => {
    if (!editingRoom || !newRoomType.trim()) {
      toast({
        title: 'Error',
        description: 'Room type is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rooms')
        .update({
          room_type: newRoomType.trim(),
          description: newRoomDescription.trim() || null,
        })
        .eq('id', editingRoom.id)
        .select()
        .single();

      if (error) throw error;

      setRooms(rooms.map(r => r.id === editingRoom.id ? data : r));
      resetForm();
      setEditingRoom(null);
      setIsEditDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Room updated successfully',
      });
    } catch (error) {
      console.error('Error updating room:', error);
      toast({
        title: 'Error',
        description: 'Failed to update room',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    if (!confirm(`Are you sure you want to delete "${room.room_type}"? This will also delete all switches in this room.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', room.id);

      if (error) throw error;

      setRooms(rooms.filter(r => r.id !== room.id));
      toast({
        title: 'Success',
        description: 'Room deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete room',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (room: Room) => {
    setEditingRoom(room);
    setNewRoomType(room.room_type || '');
    setNewRoomDescription(room.description || '');
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setNewRoomType('');
    setNewRoomDescription('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBackToHouses && (
            <Button variant="ghost" size="sm" onClick={onBackToHouses}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Houses
            </Button>
          )}
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DoorOpen className="h-6 w-6" />
            {house.house_name} - Rooms
          </h2>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="roomType">Room Type</Label>
                <Select value={newRoomType} onValueChange={setNewRoomType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Removed duplicate Room Type field */}
              <div>
                <Label htmlFor="roomDescription">Description (Optional)</Label>
                <Textarea
                  id="roomDescription"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="Enter room description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleAddRoom}>
                  Add Room
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DoorOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rooms yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add rooms to organize your switches and devices
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card 
              key={room.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedRoomId === room.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onRoomSelect?.(room)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="h-5 w-5" />
                    <span className="truncate">{room.room_type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(room);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(room);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {room.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {room.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Created {new Date(room.created_at || '').toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editRoomType">Room Type</Label>
              <Select value={newRoomType} onValueChange={setNewRoomType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editRoomDescription">Description (Optional)</Label>
              <Textarea
                id="editRoomDescription"
                value={newRoomDescription}
                onChange={(e) => setNewRoomDescription(e.target.value)}
                placeholder="Enter room description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
                setEditingRoom(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleEditRoom}>
                Update Room
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomList;