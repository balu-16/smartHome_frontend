import React, { useState, useEffect } from 'react';
import { Edit, Trash2, ArrowLeft, Lightbulb, Share2, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

import { useToast } from '@/hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { Tables } from '../integrations/supabase/types';
import DeviceControl from './DeviceControl';
import { useAuth } from '../contexts/AuthContext';

type SwitchType = Tables<'switches'> & {
  is_active?: boolean;
};
type Room = Tables<'rooms'>;

interface SwitchListProps {
  room: Room;
  onBackToRooms?: () => void;
}

// Electronic objects are now handled during device allocation

export const SwitchList: React.FC<SwitchListProps> = ({ 
  room, 
  onBackToRooms 
}) => {
  const { user } = useAuth();
  const [switches, setSwitches] = useState<SwitchType[]>([]);
  const [loading, setLoading] = useState(true);
  // Removed manual switch creation - switches are now created automatically when devices are added
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSwitch, setEditingSwitch] = useState<SwitchType | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharingSwitch, setSharingSwitch] = useState<SwitchType | null>(null);
  const [sharePhoneNumber, setSharePhoneNumber] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);

  // Reintroduce electronic object selection state for editing existing switches
  const ELECTRONIC_OBJECTS = [
    'LED Light', 'Ceiling Fan', 'Air Conditioner', 'Television', 'Smart TV',
    'Sound System', 'Microwave', 'Refrigerator', 'Dishwasher', 'Coffee Maker',
    'Water Heater', 'Room Heater', 'Security Camera', 'Door Lock', 'Smart Plug',
    'Smart Switch', 'Vacuum Cleaner', 'Air Purifier', 'Washing Machine', 'Dryer',
    'Table Lamp', 'Floor Lamp', 'Exhaust Fan', 'Table Fan', 'Tower Fan',
    'Window AC', 'Split AC', 'Home Theater', 'Music Player', 'Toaster',
    'Blender', 'Rice Cooker', 'Electric Fireplace', 'Motion Sensor', 'Smoke Detector',
    'Smart Thermostat', 'Smart Doorbell', 'Robot Vacuum', 'Iron', 'Garden Light',
    'Pool Pump', 'Sprinkler System', 'Humidifier', 'Dehumidifier', 'Electric Kettle',
    'Garage Door'
  ];
  const [selectedElectronicObject, setSelectedElectronicObject] = useState<string>('');

  const { toast } = useToast();

  // Reset helper for edit form
  const resetForm = () => {
    setSelectedElectronicObject('');
  };

  useEffect(() => {
    fetchSwitches();
  }, [room.id]);

  const fetchSwitches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('switches')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSwitches(data || []);
    } catch (error) {
      console.error('Error fetching switches:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch switches',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSwitch = async (switchId: number, newState: boolean) => {
    const { error } = await supabase
      .from('switches')
      .update({ is_active: newState })
      .eq('id', switchId);

    if (error) {
      console.error('Error updating switch:', error);
      toast({
        title: 'Error',
        description: 'Failed to update switch',
        variant: 'destructive',
      });
    } else {
      setSwitches(switches.map(s => 
        s.id === switchId ? { ...s, is_active: newState } : s
      ));
    }
  };

  // Removed handleAddSwitch - switches are now created automatically during device allocation

  const handleEditSwitch = async () => {
    if (!editingSwitch || !selectedElectronicObject) {
      toast({
        title: 'Error',
        description: 'Electronic object is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('switches')
        .update({
          electronic_object: selectedElectronicObject,
        })
        .eq('id', editingSwitch.id)
        .select()
        .single();

      if (error) throw error;

      setSwitches(switches.map(s => s.id === editingSwitch.id ? (data as SwitchType) : s));
      resetForm();
      setEditingSwitch(null);
      setIsEditDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Switch updated successfully',
      });
    } catch (error) {
      console.error('Error updating switch:', error);
      toast({
        title: 'Error',
        description: 'Failed to update switch',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSwitch = async (switchId: number, deviceName: string) => {
    if (!confirm(`Are you sure you want to delete "${deviceName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('switches')
        .delete()
        .eq('id', switchId);

      if (error) throw error;

      setSwitches(switches.filter(s => s.id !== switchId));
      toast({
        title: 'Success',
        description: 'Switch deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting switch:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete switch',
        variant: 'destructive',
      });
    }
  };



  const openEditDialog = (switchItem: SwitchType) => {
    setEditingSwitch(switchItem);
    setSelectedElectronicObject(switchItem.electronic_object);
    setIsEditDialogOpen(true);
  };

  // Removed resetForm - no longer needed without manual switch creation

  const openShareDialog = (switchItem: SwitchType) => {
    setSharingSwitch(switchItem);
    setSharePhoneNumber('');
    setIsShareDialogOpen(true);
  };

  const handleShareSwitch = async () => {
    if (!sharingSwitch || !sharePhoneNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Phone number is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSharing(true);
    try {
      // First, find the user by phone number
      const { data: targetUser, error: userError } = await supabase
        .from('signup_users')
        .select('id, full_name')
        .eq('phone_number', sharePhoneNumber.trim())
        .single();

      if (userError || !targetUser) {
        toast({
          title: 'Error',
          description: 'User with this phone number not found',
          variant: 'destructive',
        });
        return;
      }

      // Check if user is trying to share with themselves
      if (targetUser.id === Number(user?.id)) {
        toast({
          title: 'Error',
          description: 'You cannot share a switch with yourself',
          variant: 'destructive',
        });
        return;
      }

      // Check if switch is already shared with this user
      const { data: existingShare, error: checkError } = await supabase
        .from('switch_shared_with')
        .select('id')
        .eq('switch_id', sharingSwitch.id)
        .eq('shared_with_user_id', targetUser.id)
        .single();

      if (existingShare) {
        toast({
          title: 'Error',
          description: `Switch is already shared with ${targetUser.full_name}`,
          variant: 'destructive',
        });
        return;
      }

      // Create the share record
      const { error: shareError } = await supabase
        .from('switch_shared_with')
        .insert({
          switch_id: sharingSwitch.id,
          shared_with_user_id: targetUser.id,
        });

      if (shareError) {
        console.error('Error sharing switch:', shareError);
        toast({
          title: 'Error',
          description: 'Failed to share switch',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: `Switch shared successfully with ${targetUser.full_name}`,
      });
      
      setIsShareDialogOpen(false);
      setSharingSwitch(null);
      setSharePhoneNumber('');
    } catch (error) {
      console.error('Error sharing switch:', error);
      toast({
        title: 'Error',
        description: 'Failed to share switch',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const getIconForObject = (iconName: string | null) => {
    // You can expand this with more icons based on the icon_name
    switch (iconName) {
      case 'lightbulb':
      case 'light':
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading switches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBackToRooms && (
            <Button variant="ghost" size="sm" onClick={onBackToRooms}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Rooms
            </Button>
          )}
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6" />
            {room.room_type} - Switches
          </h2>
        </div>
        {/* Switches are now created automatically when devices are added */}
      </div>

      {switches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No switches yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Switches will appear here automatically when you add devices via QR code or device code
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {switches.map((switchItem) => (
            <Card key={switchItem.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getIconForObject(null)}
                    <span className="truncate">{switchItem.electronic_object}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openShareDialog(switchItem)}
                      title="Share switch"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(switchItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSwitch(switchItem.id, switchItem.electronic_object)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <DeviceControl 
                    deviceType={switchItem.electronic_object}
                    isActive={switchItem.is_active || false}
                    onToggle={() => handleToggleSwitch(switchItem.id, !switchItem.is_active)}
                    onSettingChange={(setting, value) => {
                      console.log(`${switchItem.electronic_object} ${setting} changed to:`, value);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Switch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editElectronicObject">Electronic Object</Label>
              <Select 
                 value={selectedElectronicObject} 
                 onValueChange={(value) => setSelectedElectronicObject(value)}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Select electronic object" />
                 </SelectTrigger>
                 <SelectContent>
                   {ELECTRONIC_OBJECTS.map((obj) => (
                     <SelectItem key={obj} value={obj}>
                       {obj}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
                setEditingSwitch(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleEditSwitch}>
                Update Switch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Switch</DialogTitle>
            <DialogDescription>
              Share "{sharingSwitch?.electronic_object}" with another user by entering their phone number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sharePhoneNumber">Phone Number</Label>
              <Input
                id="sharePhoneNumber"
                type="tel"
                placeholder="Enter phone number"
                value={sharePhoneNumber}
                onChange={(e) => setSharePhoneNumber(e.target.value)}
                disabled={isSharing}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter the phone number of the user you want to share this switch with.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsShareDialogOpen(false);
                  setSharingSwitch(null);
                  setSharePhoneNumber('');
                }}
                disabled={isSharing}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleShareSwitch}
                disabled={isSharing || !sharePhoneNumber.trim()}
              >
                {isSharing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Switch
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SwitchList;