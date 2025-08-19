import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Smartphone, RefreshCw, Users, Share2, Trash2, UserX } from 'lucide-react';
import ConfirmationDialog from "@/components/ConfirmationDialog";

interface SharedDevice {
  id: number;
  device_id: number;
  shared_with_user_id: number;
  shared_at: string;
  device: {
    id: number;
    device_code: string;
    device_name: string | null;
    is_active: boolean;
    created_at: string;
  };
  shared_with_user: {
    full_name: string;
    phone_number: string;
  };
}

const SentDevices = () => {
  const { user } = useAuth();
  const [sharedDevices, setSharedDevices] = useState<SharedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revokeDialog, setRevokeDialog] = useState<{
    open: boolean;
    shareId: number | null;
    deviceName: string;
    userName: string;
  }>({
    open: false,
    shareId: null,
    deviceName: '',
    userName: ''
  });

  useEffect(() => {
    fetchSentDevices();
  }, [user]);

  const fetchSentDevices = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // First, get the user's devices
      const { data: userDevices, error: userDevicesError } = await supabase
        .from('devices')
        .select('id')
        .eq('allocated_to_customer_id', Number(user.id));

      if (userDevicesError) {
        console.error('Error fetching user devices:', userDevicesError);
        toast({
          title: "Error",
          description: "Failed to fetch your devices.",
          variant: "destructive",
        });
        return;
      }

      const deviceIds = userDevices?.map(d => d.id) || [];
      
      if (deviceIds.length === 0) {
        setSharedDevices([]);
        return;
      }

      // Fetch devices shared by the current user
      const { data: sentDevices, error: sentError } = await supabase
        .from('device_shared_with')
        .select(`
          id,
          device_id,
          shared_with_user_id,
          shared_at,
          devices!inner (
            id,
            device_code,
            device_name,
            is_active,
            created_at,
            allocated_to_customer_id
          )
        `)
        .in('device_id', deviceIds);

      if (sentError) {
        console.error('Error fetching sent devices:', sentError);
        toast({
          title: "Error",
          description: "Failed to fetch sent devices.",
          variant: "destructive",
        });
        return;
      }

      // Get user information for each shared device
      const userIds = [...new Set((sentDevices || []).map((item: any) => item.shared_with_user_id))];
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
      const transformedData = (sentDevices || []).map((item: any) => ({
        id: item.id,
        device_id: item.device_id,
        shared_with_user_id: item.shared_with_user_id,
        shared_at: item.shared_at,
        device: item.devices,
        shared_with_user: usersMap[item.shared_with_user_id] || { full_name: 'Unknown User', phone_number: 'N/A' }
      }));

      setSharedDevices(transformedData);
    } catch (error) {
      console.error('Error fetching sent devices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sent devices.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!revokeDialog.shareId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('device_shared_with')
        .delete()
        .eq('id', revokeDialog.shareId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Access revoked for ${revokeDialog.userName}.`,
      });

      setRevokeDialog({ open: false, shareId: null, deviceName: '', userName: '' });
      fetchSentDevices();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({
        title: "Error",
        description: "Failed to revoke access. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeClick = (share: SharedDevice) => {
    setRevokeDialog({
      open: true,
      shareId: share.id,
      deviceName: share.device.device_name || share.device.device_code,
      userName: share.shared_with_user.full_name
    });
  };

  const formatDate = (dateString: string) => {
    // Database now stores timestamps in IST, no conversion needed
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group devices by device_id to show how many users each device is shared with
  const deviceGroups = sharedDevices.reduce((acc, share) => {
    const deviceId = share.device_id;
    if (!acc[deviceId]) {
      acc[deviceId] = {
        device: share.device,
        shares: []
      };
    }
    acc[deviceId].shares.push(share);
    return acc;
  }, {} as Record<number, { device: SharedDevice['device'], shares: SharedDevice[] }>);

  const uniqueDevices = Object.keys(deviceGroups).length;
  const totalShares = sharedDevices.length;
  const uniqueUsers = new Set(sharedDevices.map(share => share.shared_with_user_id)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sent Devices</h2>
          <p className="text-gray-600">Devices you have shared with other users</p>
        </div>
        <Button
          onClick={fetchSentDevices}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Device Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueDevices}</div>
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
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(deviceGroups).filter(group => group.device.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shared Devices List */}
      <Card>
        <CardHeader>
          <CardTitle>Shared Device Access</CardTitle>
          <CardDescription>
            {totalShares === 0 ? 'You haven\'t shared any devices yet.' : `You have shared ${uniqueDevices} device${uniqueDevices !== 1 ? 's' : ''} with ${uniqueUsers} user${uniqueUsers !== 1 ? 's' : ''}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalShares === 0 ? (
            <div className="text-center py-8">
              <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No devices shared yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Share your devices with other users from the "My Devices" section.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device Name</TableHead>
                  <TableHead>Device Code</TableHead>
                  <TableHead>Shared With</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Shared Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sharedDevices.map((share) => (
                  <TableRow key={share.id} className="bg-green-50">
                    <TableCell className="font-medium">
                      {share.device.device_name || 'Unnamed Device'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {share.device.device_code}
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
                        share.device.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {share.device.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeClick(share)}
                        className="text-red-600 hover:text-red-700"
                        title="Revoke Access"
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Revoke Access Confirmation Dialog */}
      <ConfirmationDialog
        open={revokeDialog.open}
        onOpenChange={(open) => setRevokeDialog(prev => ({ ...prev, open }))}
        title="Confirm Delete"
        description={`Are you sure you want to revoke ${revokeDialog.userName}'s access to "${revokeDialog.deviceName}"? They will no longer be able to control this device.`}
        onConfirm={handleRevokeAccess}
        confirmText="Ok"
        cancelText="Cancel"
        confirmDisabled={isLoading}
      />
    </div>
  );
};

export default SentDevices;