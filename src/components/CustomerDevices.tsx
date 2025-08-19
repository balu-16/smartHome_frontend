
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Smartphone, RefreshCw, Calendar, CheckCircle, Eye, Edit2, Check, X, Trash2, Share2 } from 'lucide-react';

import ConfirmationDialog from './ConfirmationDialog';

interface Device {
  id: number;
  device_code: string;
  qr_code: string;
  created_at: string;
  is_active: boolean;
  allocated_to_customer_id: number | null;
  allocated_to_customer_name: string | null;
  allocated_at: string | null;
  device_name: string | null;
}

const CustomerDevices = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [editingDeviceId, setEditingDeviceId] = useState<number | null>(null);
  const [editingDeviceName, setEditingDeviceName] = useState<string>('');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    deviceId: number | null;
    deviceName: string;
    deviceCode: string;
  }>({
    open: false,
    deviceId: null,
    deviceName: '',
    deviceCode: ''
  });
  const [deleteAllDialog, setDeleteAllDialog] = useState(false);
  // Add state for share dialog
  const [shareDialog, setShareDialog] = useState({ open: false, device: null });
  const [sharePhone, setSharePhone] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');

  const fetchMyDevices = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch only devices owned by the user
      const { data: ownedDevices, error: ownedError } = await supabase
        .from('devices')
        .select('*')
        .eq('allocated_to_customer_id', Number(user.id))
        .order('allocated_at', { ascending: false });

      if (ownedError) {
        console.error('Error fetching owned devices:', ownedError);
        toast({
          title: "Error",
          description: "Failed to fetch your devices.",
          variant: "destructive",
        });
        return;
      }

      // Set only owned devices (no shared devices in My Devices section)
      setDevices(ownedDevices || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDevices();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeviceNameDoubleClick = (device: Device) => {
    setEditingDeviceId(device.id);
    setEditingDeviceName(device.device_name || '');
  };

  const handleDeviceNameSave = async (deviceId: number) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ device_name: editingDeviceName.trim() || null })
        .eq('id', deviceId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update device name. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Update local state
      setDevices(devices.map(device =>
        device.id === deviceId
          ? { ...device, device_name: editingDeviceName.trim() || null }
          : device
      ));

      toast({
        title: 'Success',
        description: 'Device name updated successfully.',
      });

      setEditingDeviceId(null);
      setEditingDeviceName('');
    } catch (error) {
      console.error('Error updating device name:', error);
      toast({
        title: 'Error',
        description: 'Failed to update device name. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeviceNameCancel = () => {
    setEditingDeviceId(null);
    setEditingDeviceName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, deviceId: number) => {
    if (e.key === 'Enter') {
      handleDeviceNameSave(deviceId);
    } else if (e.key === 'Escape') {
      handleDeviceNameCancel();
    }
  };

  const handleDeleteClick = (device: Device) => {
    setDeleteDialog({
      open: true,
      deviceId: device.id,
      deviceName: device.device_name || '',
      deviceCode: device.device_code
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.deviceId) return;
    setIsLoading(true);
    try {

      // Delete all sharing records for this device
      const { error: shareError } = await supabase
        .from('device_shared_with')
        .delete()
        .eq('device_id', deleteDialog.deviceId);
      
      if (shareError) {
        console.error('Error deleting device sharing records:', shareError);
        toast({
          title: 'Warning',
          description: 'Device unassigned but some sharing records may remain.',
          variant: 'default',
        });
      }

      // Then, unassign the device from the customer
      const { error } = await supabase
        .from('devices')
        .update({ allocated_to_customer_id: null, allocated_to_customer_name: null, allocated_at: null, device_name: null })
        .eq('id', deleteDialog.deviceId);
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete device.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Device deleted successfully.',
        });
        fetchMyDevices();
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete device.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialog({ open: false, deviceId: null, deviceName: '', deviceCode: '' });
      setIsLoading(false);
    }
  };

  const confirmDeleteAll = async () => {
    if (!user || devices.length === 0) return;
    setIsLoading(true);
    try {
      // Get all device IDs for this user
      const deviceIds = devices.map(device => device.id);
      
      // Delete all sharing records for these devices
      const { error: shareError } = await supabase
        .from('device_shared_with')
        .delete()
        .in('device_id', deviceIds);
      
      if (shareError) {
        console.error('Error deleting device sharing records:', shareError);
        toast({
          title: 'Warning',
          description: 'Devices unassigned but some sharing records may remain.',
          variant: 'default',
        });
      }

      const { error } = await supabase
        .from('devices')
        .update({ allocated_to_customer_id: null, allocated_to_customer_name: null, allocated_at: null, device_name: null })
        .eq('allocated_to_customer_id', Number(user.id));
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete all devices.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'All devices deleted successfully.',
        });
        fetchMyDevices();
      }
    } catch (error) {
      console.error('Error deleting all devices:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete all devices.',
        variant: 'destructive',
      });
    } finally {
      setDeleteAllDialog(false);
      setIsLoading(false);
    }
  };

  // Device share handler
  const handleShareDevice = async () => {
    if (!shareDialog.device || !sharePhone.trim()) {
      setShareError('Please enter a valid phone number.');
      return;
    }

    setShareLoading(true);
    setShareError('');

    try {
      // First, find the user by phone number
      const { data: userData, error: userError } = await supabase
        .from('signup_users')
        .select('id, full_name')
        .eq('phone_number', sharePhone.trim())
        .single();

      if (userError || !userData) {
        setShareError('User with this phone number not found.');
        setShareLoading(false);
        return;
      }

      // Check if device is already shared with this user
      const { data: existingShare, error: checkError } = await supabase
        .from('device_shared_with')
        .select('id')
        .eq('device_id', shareDialog.device.id)
        .eq('shared_with_user_id', userData.id)
        .single();

      if (existingShare) {
        setShareError('Device is already shared with this user.');
        setShareLoading(false);
        return;
      }

      // Database now handles IST conversion, no manual conversion needed
      const now = new Date();
      
      // Share the device by inserting into device_shared_with table
      const { error: shareError } = await supabase
        .from('device_shared_with')
        .insert({
          device_id: shareDialog.device.id,
          shared_with_user_id: userData.id,
          shared_at: now.toISOString()
        });

      if (shareError) {
        console.error('Error sharing device:', shareError);
        setShareError('Failed to share device. Please try again.');
      } else {
        toast({
          title: 'Success',
          description: `Device shared successfully with ${userData.full_name}!`
        });
        setShareDialog({ open: false, device: null });
        setSharePhone('');
      }
    } catch (error) {
      console.error('Error sharing device:', error);
      setShareError('An unexpected error occurred. Please try again.');
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="w-8 h-8" />
          <h1 className="text-3xl font-bold">My Devices</h1>
        </div>
        <p className="text-lg opacity-90">
          View and manage all devices allocated to your account
        </p>
      </div>

      {/* Device Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owned Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {devices.length}
            </div>
          </CardContent>
        </Card>



        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {devices.filter(device => device.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Device List
              </CardTitle>
              <CardDescription>
                All devices allocated to your account
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchMyDevices}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button
                onClick={() => setDeleteAllDialog(true)}
                disabled={devices.length === 0 || isLoading}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Devices
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-12">
              <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Devices Found</h3>
              <p className="text-gray-500 mb-4">
                You haven't added any devices yet. Use the "Add Device" section to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Device Code</TableHead>

                    <TableHead>Status</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead>Device Control</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">
                        {editingDeviceId === device.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingDeviceName}
                              onChange={(e) => setEditingDeviceName(e.target.value)}
                              onKeyDown={(e) => handleKeyPress(e, device.id)}
                              placeholder="Enter device name"
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeviceNameSave(device.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleDeviceNameCancel}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded group"
                            onDoubleClick={() => handleDeviceNameDoubleClick(device)}
                            title="Double-click to edit device name"
                          >
                            <span>
                              {device.device_name || (
                                <span className="text-gray-400 italic">Unnamed Device</span>
                              )}
                            </span>
                            <Edit2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        {device.device_code}
                      </TableCell>

                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${device.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {device.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatDate(device.allocated_at || device.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          disabled
                        >
                          <Smartphone className="w-4 h-4" />
                          Control Panel
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-2">
                          {device.qr_code ? (
                            <img
                              src={device.qr_code}
                              alt={`QR Code for ${device.device_code}`}
                              className="w-16 h-16 border border-gray-300 rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 border border-gray-300 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No QR</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(device)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete Device"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShareDialog({ open: true, device })}
                            className="text-blue-600 hover:text-blue-700"
                            title="Share Device"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Confirm Delete"
        description={`Are you sure you want to delete "${deleteDialog.deviceName || deleteDialog.deviceCode}"?`}
        onConfirm={confirmDelete}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <ConfirmationDialog
        open={deleteAllDialog}
        onOpenChange={setDeleteAllDialog}
        title="Confirm Delete"
        description="Are you sure you want to delete all your devices?"
        onConfirm={confirmDeleteAll}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <ConfirmationDialog
        open={shareDialog.open}
        onOpenChange={(open) => setShareDialog({ open, device: open ? shareDialog.device : null })}
        title="Share Device"
        description={shareDialog.device ? `Share device '${shareDialog.device.device_name || shareDialog.device.device_code}' with another user by phone number.` : ''}
        onConfirm={handleShareDevice}
        confirmText={shareLoading ? 'Sharing...' : 'Share'}
        confirmDisabled={shareLoading || !sharePhone}
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Recipient Phone Number</label>
          <input
            type="text"
            value={sharePhone}
            onChange={e => setSharePhone(e.target.value)}
            placeholder="Enter recipient's phone number"
            className="w-full border rounded px-2 py-1"
            disabled={shareLoading}
          />
          {shareError && <div className="text-red-600 text-sm">{shareError}</div>}
        </div>
      </ConfirmationDialog>
    </div>
  );
};

export default CustomerDevices;
