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
  switch_id: number;
  shared_with_user_id: number;
  shared_at: string;
  switch: {
    id: number;
    electronic_object: string;
    is_active: boolean | null;
    created_at: string | null;
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
      // Fetch switches shared with the current user with complete hierarchy info
      const { data: receivedSwitches, error: receivedError } = await supabase
        .from('switch_shared_with')
        .select(`
          id,
          switch_id,
          shared_with_user_id,
          shared_at,
          switches!switch_shared_with_switch_id_fkey (
            id,
            electronic_object,
            is_active,
            created_at,
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
        .eq('shared_with_user_id', Number(user.id));

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
        switch_id: item.switch_id,
        shared_with_user_id: item.shared_with_user_id,
        shared_at: item.shared_at,
        switch: {
          id: item.switches?.id || 0,
          electronic_object: item.switches?.electronic_object || 'Unknown',
          is_active: item.switches?.is_active || false,
          created_at: item.switches?.created_at || '',
          room: {
            id: item.switches?.rooms?.id || 0,
            room_type: item.switches?.rooms?.room_type || 'Unknown Type',
            house: {
              id: item.switches?.rooms?.houses?.id || 0,
              house_name: item.switches?.rooms?.houses?.house_name || 'Unknown House',
              user: {
                full_name: item.switches?.rooms?.houses?.signup_users?.full_name || 'Unknown User',
                phone_number: item.switches?.rooms?.houses?.signup_users?.phone_number || 'N/A',
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

  const handleToggleSwitch = async (switchId: number, newState: boolean) => {
    try {
      const { error } = await supabase
        .from('switches')
        .update({ is_active: newState })
        .eq('id', switchId);

      if (error) {
        console.error('Error updating switch:', error);
        toast({
          title: "Error",
          description: "Failed to update switch state.",
          variant: "destructive",
        });
      } else {
        // Update local state
        setReceivedSwitches(prev => 
          prev.map(item => 
            item.switch.id === switchId 
              ? { ...item, switch: { ...item.switch, is_active: newState } }
              : item
          )
        );
        toast({
          title: "Success",
          description: `Switch ${newState ? 'turned on' : 'turned off'} successfully.`,
        });
      }
    } catch (error) {
      console.error('Error updating switch:', error);
      toast({
        title: "Error",
        description: "Failed to update switch state.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAccess = async () => {
    if (!removeDialog.shareId) return;

    try {
      const { error } = await supabase
        .from('switch_shared_with')
        .delete()
        .eq('id', removeDialog.shareId);

      if (error) {
        console.error('Error removing switch access:', error);
        toast({
          title: "Error",
          description: "Failed to remove switch access.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Switch access removed successfully.",
        });
        fetchReceivedSwitches();
      }
    } catch (error) {
      console.error('Error removing switch access:', error);
      toast({
        title: "Error",
        description: "Failed to remove switch access.",
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
  const activeSwitches = receivedSwitches.filter(item => item.switch.is_active).length;
  const uniqueOwners = new Set(receivedSwitches.map(item => item.switch.room.house.user.full_name)).size;
  const uniqueHouses = new Set(receivedSwitches.map(item => item.switch.room.house.house_name)).size;

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
                          {item.switch.room.house.user.full_name}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.switch.room.house.house_name}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.switch.room.room_type}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.switch.electronic_object}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {item.switch.room.house.user.phone_number}
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
                            switch: item.switch
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
                            switchInfo: `${item.switch.room.house.house_name} > ${item.switch.room.room_type} > ${item.switch.electronic_object}`,
                            ownerName: item.switch.room.house.user.full_name
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
                isActive={controlDialog.switch.is_active || false}
                onToggle={() => {
                  handleToggleSwitch(controlDialog.switch.id, !controlDialog.switch.is_active);
                  // Update the switch state in the dialog
                  setControlDialog(prev => ({
                    ...prev,
                    switch: {
                      ...prev.switch,
                      is_active: !prev.switch.is_active
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