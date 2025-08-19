import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Smartphone, RefreshCw, MapPin, Eye, Satellite } from 'lucide-react';

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
  owner_name?: string;
}

const ReceivedDevices = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    fetchReceivedDevices();
  }, [user]);

  const fetchReceivedDevices = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch devices shared with the current user
      const { data: sharedDevices, error: sharedError } = await supabase
        .from('device_shared_with')
        .select(`
          device_id,
          shared_at,
          devices!inner (
            id,
            device_code,
            qr_code,
            created_at,
            is_active,
            allocated_to_customer_id,
            allocated_to_customer_name,
            allocated_at,
            device_name
          )
        `)
        .eq('shared_with_user_id', Number(user.id));

      if (sharedError) {
        console.error('Error fetching shared devices:', sharedError);
        toast({
          title: "Error",
          description: "Failed to fetch received devices.",
          variant: "destructive",
        });
        return;
      }

      // Get owner information for each shared device
      const ownerIds = [...new Set((sharedDevices || []).map((item: any) => item.devices.allocated_to_customer_id))].filter(Boolean);
      
      let ownersMap = {} as Record<number, any>;
      if (ownerIds.length > 0) {
        const { data: ownersData, error: ownersError } = await supabase
          .from('signup_users')
          .select('id, full_name')
          .in('id', ownerIds);

        if (ownersError) {
          console.error('Error fetching owners data:', ownersError);
        }

        ownersMap = (ownersData || []).reduce((acc, owner) => {
          acc[owner.id] = owner;
          return acc;
        }, {} as Record<number, any>);
      }

      // Transform the data to match our interface and filter out devices with unknown owners
      const devicesWithOwners = (sharedDevices || [])
        .map((item: any) => {
          const device = item.devices;
          const owner = ownersMap[device.allocated_to_customer_id];
          
          return {
            ...device,
            owner_name: owner?.full_name || 'Unknown Owner'
          };
        })
        .filter(device => device.owner_name !== 'Unknown Owner'); // Filter out devices with unknown owners

      setDevices(devicesWithOwners);
    } catch (error) {
      console.error('Error fetching received devices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch received devices.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Received Devices</h2>
          <p className="text-gray-600">Devices shared with you by other users</p>
        </div>
        <Button
          onClick={fetchReceivedDevices}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Device Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Satellite className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {devices.filter(device => device.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Owners</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Set(devices.map(device => device.owner_name)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>Received Devices</CardTitle>
          <CardDescription>
            {devices.length === 0 ? 'No devices have been shared with you yet.' : `You have access to ${devices.length} shared device${devices.length !== 1 ? 's' : ''}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No shared devices found</p>
              <p className="text-sm text-gray-400 mt-2">
                When other users share devices with you, they will appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device Name</TableHead>
                  <TableHead>Device Code</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Shared Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id} className="bg-blue-50">
                    <TableCell className="font-medium">
                      {device.device_name || 'Unnamed Device'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {device.device_code}
                    </TableCell>
                    <TableCell>
                      <span className="text-blue-700 font-medium">
                        {device.owner_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        device.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {device.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(device.allocated_at || device.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDevice(device)}
                          className="text-blue-600 hover:text-blue-700"
                          title="View Device"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Device Details Dialog */}
      <Dialog open={!!selectedDevice} onOpenChange={() => setSelectedDevice(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDevice?.device_name || 'Unnamed Device'} - {selectedDevice?.device_code}
            </DialogTitle>
            <DialogDescription>
              Shared by {selectedDevice?.owner_name} • Device control and automation
            </DialogDescription>
          </DialogHeader>
          
          {selectedDevice && (
            <div className="space-y-4">
              <div className="flex gap-2 border-b">
                <Button
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Route History
                </Button>
              </div>
              
              <div className="h-[500px] flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Route History</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Device: {selectedDevice.device_code}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default ReceivedDevices;