import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Lightbulb, RefreshCw, Users, Share2, Trash2, UserX } from 'lucide-react';
import ConfirmationDialog from "@/components/ConfirmationDialog";

interface SharedSwitch {
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
      };
    };
  };
  shared_with_user: {
    full_name: string;
    phone_number: string;
  };
}

const SentSwitches = () => {
  const { user } = useAuth();
  const [sharedSwitches, setSharedSwitches] = useState<SharedSwitch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revokeDialog, setRevokeDialog] = useState<{
    open: boolean;
    shareId: number | null;
    switchInfo: string;
    userName: string;
  }>({
    open: false,
    shareId: null,
    switchInfo: '',
    userName: ''
  });

  useEffect(() => {
    fetchSentSwitches();
  }, [user]);

  const fetchSentSwitches = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch devices shared by the current user with complete hierarchy info
      const { data: sentSwitches, error: sentError } = await supabase
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
                user_id
              )
            )
          )
        `)
        .eq('devices.rooms.houses.user_id', Number(user.id))
        .neq('shared_with_user_id', Number(user.id))
        .not('devices.electronic_object', 'is', null);

      if (sentError) {
        console.error('Error fetching sent switches:', sentError);
        toast({
          title: "Error",
          description: "Failed to fetch sent switches.",
          variant: "destructive",
        });
        return;
      }

      // Get user information for each shared switch
      const userIds = [...new Set((sentSwitches || []).map((item: any) => item.shared_with_user_id))];
      const { data: usersData, error: usersError } = await supabase
        .from('signup_users')
        .select('id, full_name, phone_number')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users data:', usersError);
      }

      const usersMap = (usersData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<number, any>);

      // Transform the data to match our interface
      const transformedData = (sentSwitches || []).map((item: any) => ({
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
            },
          },
        },
        shared_with_user: usersMap[item.shared_with_user_id] || { full_name: 'Unknown User', phone_number: 'N/A' }
      }));

      setSharedSwitches(transformedData);
    } catch (error) {
      console.error('Error fetching sent switches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sent switches.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!revokeDialog.shareId) return;

    try {
      const { error } = await supabase
        .from('device_shared_with')
        .delete()
        .eq('id', revokeDialog.shareId);

      if (error) {
        console.error('Error revoking device share:', error);
        toast({
          title: "Error",
          description: "Failed to revoke device access.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Device access revoked successfully.",
        });
        fetchSentSwitches();
      }
    } catch (error) {
      console.error('Error revoking device share:', error);
      toast({
        title: "Error",
        description: "Failed to revoke device access.",
        variant: "destructive",
      });
    } finally {
      setRevokeDialog({ open: false, shareId: null, switchInfo: '', userName: '' });
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

  // Group devices by device_id to show how many users each device is shared with
  const deviceGroups = sharedSwitches.reduce((acc, share) => {
    const deviceId = share.device_id;
    if (!acc[deviceId]) {
      acc[deviceId] = {
        device: share.device,
        shares: []
      };
    }
    acc[deviceId].shares.push(share);
    return acc;
  }, {} as Record<number, { device: SharedSwitch['device'], shares: SharedSwitch[] }>);

  const uniqueSwitches = Object.keys(deviceGroups).length;
  const totalShares = sharedSwitches.length;
  const uniqueUsers = new Set(sharedSwitches.map(share => share.shared_with_user_id)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sent Switches</h2>
          <p className="text-gray-600">Switches you have shared with other users</p>
        </div>
        <Button
          onClick={fetchSentSwitches}
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
            <CardTitle className="text-sm font-medium">Shared Switches</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueSwitches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <Share2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalShares}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{uniqueUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Switches</CardTitle>
            <Lightbulb className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(deviceGroups).filter(group => group.device.switch_is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shared Switches List */}
      <Card>
        <CardHeader>
          <CardTitle>Shared Switch Access</CardTitle>
          <CardDescription>
            {totalShares === 0 ? 'You haven\'t shared any switches yet.' : `You have shared ${uniqueSwitches} switch${uniqueSwitches !== 1 ? 'es' : ''} with ${uniqueUsers} user${uniqueUsers !== 1 ? 's' : ''}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalShares === 0 ? (
            <div className="text-center py-8">
              <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No switches shared yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Share your switches with other users from the "Switch List" section.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>House</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Electronic Object</TableHead>
                  <TableHead>Shared With</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Shared Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sharedSwitches.map((share) => (
                  <TableRow key={share.id} className="bg-green-50">
                    <TableCell className="font-medium">
                      {share.device.room.house.house_name}
                    </TableCell>
                    <TableCell className="font-medium">
                      {share.device.room.room_type}
                    </TableCell>
                    <TableCell className="font-medium">
                      {share.device.electronic_object}
                    </TableCell>
                    <TableCell>
                      <span className="text-green-700 font-medium">
                        {share.shared_with_user.full_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {share.shared_with_user.phone_number}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(share.shared_at)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        share.device.switch_is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {share.device.switch_is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRevokeDialog({
                          open: true,
                          shareId: share.id,
                          switchInfo: `${share.device.room.house.house_name} > ${share.device.room.room_type} > ${share.device.electronic_object}`,
                          userName: share.shared_with_user.full_name
                        })}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <ConfirmationDialog
        open={revokeDialog.open}
        onOpenChange={(open) => setRevokeDialog({ ...revokeDialog, open })}
        title="Confirm Delete"
        description={`Are you sure you want to revoke access to "${revokeDialog.switchInfo}" from ${revokeDialog.userName}?`}
        onConfirm={handleRevokeShare}
        confirmText="Ok"
        cancelText="Cancel"
      />
    </div>
  );
};

export default SentSwitches;