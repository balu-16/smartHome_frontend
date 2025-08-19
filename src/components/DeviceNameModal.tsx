import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, X, Home, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface House {
  id: number;
  house_name: string;
}

interface Room {
  id: number;
  room_type: string;
  house_id: number;
}

interface DeviceNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceCode: string;
  onSuccess: () => void;
  onCancel?: () => void;
  onAllocateDevice: (deviceCode: string, deviceName?: string, deviceIcon?: string, houseId?: number, roomId?: number, electronicObject?: string) => Promise<boolean>;
}

// Predefined list of electronic objects
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

const DeviceNameModal: React.FC<DeviceNameModalProps> = ({
  isOpen,
  onClose,
  deviceCode,
  onSuccess,
  onCancel,
  onAllocateDevice
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deviceName, setDeviceName] = useState('');
  const [selectedHouseId, setSelectedHouseId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedElectronicObject, setSelectedElectronicObject] = useState<string>('');
  const [houses, setHouses] = useState<House[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHouses, setIsLoadingHouses] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Fetch houses when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchHouses();
    }
  }, [isOpen, user]);

  // Fetch rooms when house is selected
  useEffect(() => {
    if (selectedHouseId) {
      fetchRooms(parseInt(selectedHouseId));
    } else {
      setRooms([]);
      setSelectedRoomId('');
    }
  }, [selectedHouseId]);

  const fetchHouses = async () => {
    if (!user) return;
    
    setIsLoadingHouses(true);
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('id, house_name')
        .eq('user_id', parseInt(user.id))
        .order('house_name');

      if (error) {
        console.error('Error fetching houses:', error);
        toast({
          title: "Error",
          description: "Failed to load houses. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setHouses(data || []);
    } catch (error) {
      console.error('Error fetching houses:', error);
    } finally {
      setIsLoadingHouses(false);
    }
  };

  const fetchRooms = async (houseId: number) => {
    setIsLoadingRooms(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, room_type, house_id')
        .eq('house_id', houseId)
        .order('room_type');

      if (error) {
        console.error('Error fetching rooms:', error);
        toast({
          title: "Error",
          description: "Failed to load rooms. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deviceName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a device name.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedHouseId) {
      toast({
        title: "Error",
        description: "Please select a house.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRoomId) {
      toast({
        title: "Error",
        description: "Please select a room.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedElectronicObject) {
      toast({
        title: "Error",
        description: "Please select an electronic object.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onAllocateDevice(
        deviceCode, 
        deviceName.trim(), 
        undefined,
        parseInt(selectedHouseId),
        parseInt(selectedRoomId),
        selectedElectronicObject
      );
      if (success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving device:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (isSubmitting) return;
    
    if (!selectedHouseId) {
      toast({
        title: "Error",
        description: "Please select a house.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRoomId) {
      toast({
        title: "Error",
        description: "Please select a room.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedElectronicObject) {
      toast({
        title: "Error",
        description: "Please select an electronic object.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const success = await onAllocateDevice(
        deviceCode, 
        undefined, 
        undefined,
        parseInt(selectedHouseId),
        parseInt(selectedRoomId),
        selectedElectronicObject
      );
      if (success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error allocating device:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      setDeviceName('');
      setSelectedHouseId('');
      setSelectedRoomId('');
      setSelectedElectronicObject('');
      setHouses([]);
      setRooms([]);
      if (onCancel) {
        onCancel();
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Name Your Device</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Give your device a memorable name for easy identification.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="device-code" className="text-sm font-medium">
                Device Code
              </Label>
              <Input
                id="device-code"
                value={deviceCode}
                disabled
                className="font-mono text-sm bg-gray-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Home className="h-4 w-4" />
                Select House
              </Label>
              <Select
                value={selectedHouseId}
                onValueChange={setSelectedHouseId}
                disabled={isSubmitting || isLoadingHouses}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoadingHouses ? "Loading houses..." : "Choose a house"} />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id.toString()}>
                      {house.house_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Select Room
              </Label>
              <Select
                value={selectedRoomId}
                onValueChange={setSelectedRoomId}
                disabled={isSubmitting || isLoadingRooms || !selectedHouseId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    !selectedHouseId 
                      ? "Select a house first" 
                      : isLoadingRooms 
                      ? "Loading rooms..." 
                      : "Choose a room"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id.toString()}>
                      {room.room_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Electronic Object *
              </Label>
              <Select
                value={selectedElectronicObject}
                onValueChange={setSelectedElectronicObject}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose electronic object" />
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
            
            <div className="space-y-2">
              <Label htmlFor="device-name" className="text-sm font-medium">
                Device Name
              </Label>
              <Input
                id="device-name"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g., Living Room Light, Kitchen Fan..."
                disabled={isSubmitting}
                maxLength={50}
                className="focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <p className="text-xs text-gray-500">
                {deviceName.length}/50 characters
              </p>
            </div>
            
            
            <div className="space-y-3 pt-4">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Adding...' : 'Skip'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !deviceName.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? 'Saving...' : 'Save Name'}
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="w-full text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceNameModal;