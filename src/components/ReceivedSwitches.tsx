import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from '../hooks/use-toast';
import { RefreshCw, Lightbulb, Power, Users, Home, Share2, UserMinus } from 'lucide-react';
import DeviceControl from './DeviceControl';
import ConfirmationDialog from './ConfirmationDialog';

interface ReceivedSwitch {
  id: number;
  device_id: number;
  shared_with_user_id: number;
  shared_at: string;
  device: {
    id: number;
    electronic_object: string;
    switch_is_active: boolean | null;
    switch_created_at: string | null;
    room: {
      id: number;
      room_type: string | null;
      house: {
        id: number;
        house_name: string;
        user: {
          full_name: string;
          phone_number: string;
        };
      };
    };
  };
}

const ReceivedSwitches = () => {
  const { user } = useAuth();
  const [receivedSwitches, setReceivedSwitches] = useState<ReceivedSwitch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    shareId: number | null;
    switchInfo: string;
    ownerName: string;
  }>({
    open: false,
    shareId: null,
    switchInfo: '',
    ownerName: ''
  });

  const [controlDialog, setControlDialog] = useState<{
    open: boolean;
    switch: any;
  }>({
    open: false,
    switch: null
  });

  useEffect(() => {
    fetchReceivedSwitches();
  }, [user]);

  const fetchReceivedSwitches = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch devices shared with the current user with complete hierarchy info
      const { data: receivedSwitches, error: receivedError } = await supabase
        .from('device_shared_with')
        .select(`
          id,
          device_id,
          shared_with_user_id,
          shared_at,
          devices!device_shared_with_device_id_fkey (
            id,
            electronic_object,
            switch_is_active,
            switch_created_at,
            rooms!inner (
              id,
              room_type,
              houses!inner (
                id,
                house_name,
                user_id,
                signup_users!inner (
                  id,
                  full_name,
                  phone_number
                )
              )
            )
          )
        `)
        .eq('shared_with_user_id', Number(user.id))
        .not('devices.electronic_object', 'is', null);

      if (receivedError) {
        console.error('Error fetching received switches:', receivedError);
        toast({
          title: "Error",
          description: "Failed to fetch received switches.",
          variant: "destructive",
        });
        return;
      }

      // Transform the data to match our interface
      const transformedData = (receivedSwitches || []).map((item: any) => ({
        id: item.id,
        device_id: item.device_id,
        shared_with_user_id: item.shared_with_user_id,
        shared_at: item.shared_at,
        device: {
          id: item.devices?.id || 0,
          electronic_object: item.devices?.electronic_object || 'Unknown',
          switch_is_active: item.devices?.switch_is_active || false,
          switch_created_at: item.devices?.switch_created_at || '',
          room: {
            id: item.devices?.rooms?.id || 0,
            room_type: item.devices?.rooms?.room_type || 'Unknown Type',
            house: {
              id: item.devices?.rooms?.houses?.id || 0,
              house_name: item.devices?.rooms?.houses?.house_name || 'Unknown House',
              user: {
                full_name: item.devices?.rooms?.houses?.signup_users?.full_name || 'Unknown User',
                phone_number: item.devices?.rooms?.houses?.signup_users?.phone_number || 'N/A',
              },
            },
          },
        },
      }));

      setReceivedSwitches(transformedData);
    } catch (error) {
      console.error('Error fetching received switches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch received switches.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSwitch = async (deviceId: number, newState: boolean) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ switch_is_active: newState })
        .eq('id', deviceId);

      if (error) {
        console.error('Error updating device:', error);
        toast({
          title: "Error",
          description: "Failed to update device state.",
          variant: "destructive",
        });
      } else {
        // Update local state
        setReceivedSwitches(prev => 
          prev.map(item => 
            item.device.id === deviceId 
              ? { ...item, device: { ...item.device, switch_is_active: newState } }
              : item
          )
        );
        toast({
          title: "Success",
          description: `Device ${newState ? 'turned on' : 'turned off'} successfully.`,
        });
      }
    } catch (error) {
      console.error('Error updating device:', error);
      toast({
        title: "Error",
        description: "Failed to update device state.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAccess = async () => {
    if (!removeDialog.shareId) return;

    try {
      const { error } = await supabase
        .from('device_shared_with')
        .delete()
        .eq('id', removeDialog.shareId);

      if (error) {
        console.error('Error removing device access:', error);
        toast({
          title: "Error",
          description: "Failed to remove device access.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Device access removed successfully.",
        });
        fetchReceivedSwitches();
      }
    } catch (error) {
      console.error('Error removing device access:', error);
      toast({
        title: "Error",
        description: "Failed to remove device access.",
        variant: "destructive",
      });
    } finally {
      setRemoveDialog({ open: false, shareId: null, switchInfo: '', ownerName: '' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalSwitches = receivedSwitches.length;
  const activeSwitches = receivedSwitches.filter(item => item.device.switch_is_active).length;
  const uniqueOwners = new Set(receivedSwitches.map(item => item.device.room.house.user.full_name)).size;
  const uniqueHouses = new Set(receivedSwitches.map(item => item.device.room.house.house_name)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Received Switches</h2>
          <p className="text-gray-600">Switches shared with you by other users</p>
        </div>
        <Button
          onClick={fetchReceivedSwitches}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Switch Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Switches</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSwitches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Switches</CardTitle>
            <Power className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSwitches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owners</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{uniqueOwners}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Houses</CardTitle>
            <Share2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{uniqueHouses}</div>
          </CardContent>
        </Card>
      </div>

      {/* Received Switches List */}
      <Card>
        <CardHeader>
          <CardTitle>Shared Switch Access</CardTitle>
          <CardDescription>
            {totalSwitches === 0 ? 'No switches have been shared with you yet.' : `You have access to ${totalSwitches} switch${totalSwitches !== 1 ? 'es' : ''} from ${uniqueOwners} owner${uniqueOwners !== 1 ? 's' : ''}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalSwitches === 0 ? (
            <div className="text-center py-8">
              <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No switches shared with you yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Ask other users to share their switches with you.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table View */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead>House</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Electronic Object</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Shared Date</TableHead>
                    <TableHead>Control</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivedSwitches.map((item) => (
                    <TableRow key={item.id} className="bg-blue-50">
                      <TableCell className="font-medium">
                        <span className="text-blue-700">
                          {item.device.room.house.user.full_name}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.device.room.house.house_name}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.device.room.room_type}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.device.electronic_object}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {item.device.room.house.user.phone_number}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(item.shared_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setControlDialog({
                            open: true,
                            switch: item.device
                          })}
                          className="flex items-center gap-2"
                        >
                          <Power className="w-4 h-4" />
                          Control
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRemoveDialog({
                            open: true,
                            shareId: item.id,
                            switchInfo: `${item.device.room.house.house_name} > ${item.device.room.room_type} > ${item.device.electronic_object}`,
                            ownerName: item.device.room.house.user.full_name
                          })}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <UserMinus className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Control Modal */}
      <Dialog open={controlDialog.open} onOpenChange={(open) => setControlDialog({ ...controlDialog, open })}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Lightbulb className="w-5 h-5" />
               {controlDialog.switch?.electronic_object || 'Device Control'}
             </DialogTitle>
           </DialogHeader>
          {controlDialog.switch && (
            <div className="mt-4">
              <DeviceControl
                deviceType={controlDialog.switch.electronic_object}
                isActive={controlDialog.switch.switch_is_active || false}
                onToggle={() => {
                  handleToggleSwitch(controlDialog.switch.id, !controlDialog.switch.switch_is_active);
                  // Update the switch state in the dialog
                  setControlDialog(prev => ({
                    ...prev,
                    switch: {
                      ...prev.switch,
                      switch_is_active: !prev.switch.switch_is_active
                    }
                  }));
                }}
                onSettingChange={(setting, value) => {
                  console.log(`Setting ${setting} to ${value} for switch ${controlDialog.switch.id}`);
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Access Confirmation Dialog */}
      <ConfirmationDialog
        open={removeDialog.open}
        onOpenChange={(open) => setRemoveDialog({ ...removeDialog, open })}
        title="Confirm Delete"
        description={`Are you sure you want to remove your access to "${removeDialog.switchInfo}" shared by ${removeDialog.ownerName}?`}
        onConfirm={handleRemoveAccess}
        confirmText="Ok"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ReceivedSwitches;