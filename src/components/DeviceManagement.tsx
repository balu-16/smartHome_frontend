 
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { QrCode, RefreshCw, Trash2, Eye, EyeOff, Edit } from 'lucide-react';
import QRCode from 'qrcode';
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
  device_m2m_number: string | null;
}

const DeviceManagement = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceCount, setDeviceCount] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodes, setQrCodes] = useState<{[key: string]: string}>({});
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    deviceId: number | null;
    deviceCode: string;
  }>({
    open: false,
    deviceId: null,
    deviceCode: ''
  });
  const [editingM2MId, setEditingM2MId] = useState<number | null>(null);
  const [editingM2MNumber, setEditingM2MNumber] = useState<string>('');
  const [showM2MNumbers, setShowM2MNumbers] = useState<{[key: number]: boolean}>({});
  const [isUpdatingM2M, setIsUpdatingM2M] = useState(false);

  const generateDeviceCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateQRCodeDataURL = async (deviceCode: string): Promise<string> => {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(deviceCode, {
        width: 120,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching devices:', error);
        toast({
          title: "Error",
          description: "Failed to fetch devices.",
          variant: "destructive",
        });
      } else {
        setDevices(data || []);
        const qrCodeMap: {[key: string]: string} = {};
        for (const device of data || []) {
          const qrDataURL = await generateQRCodeDataURL(device.device_code);
          qrCodeMap[device.device_code] = qrDataURL;
        }
        setQrCodes(qrCodeMap);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDevices = async () => {
    const count = parseInt(deviceCount);
    if (!count || count < 1) {
      toast({
        title: "Error",
        description: "Please enter a valid number of devices to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const newDevices = [];
      for (let i = 0; i < count; i++) {
        const deviceCode = generateDeviceCode();
        const qrCode = await generateQRCodeDataURL(deviceCode);
        
        newDevices.push({
          device_code: deviceCode,
          qr_code: qrCode,
          is_active: true
        });
      }

      const { error } = await supabase
        .from('devices')
        .insert(newDevices);

      if (error) {
        console.error('Error generating devices:', error);
        toast({
          title: "Error",
          description: "Failed to generate devices.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `${count} device(s) generated successfully.`,
        });
        fetchDevices();
        setDeviceCount('');
      }
    } catch (error) {
      console.error('Error generating devices:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteClick = (deviceId: number, deviceCode: string) => {
    setDeleteDialog({
      open: true,
      deviceId,
      deviceCode
    });
  };

  const handleM2MEdit = (device: Device) => {
    setEditingM2MId(device.id);
    setEditingM2MNumber(device.device_m2m_number || '');
  };

  const handleM2MSave = async (deviceId: number) => {
    if (editingM2MNumber && (editingM2MNumber.length !== 13 || !/^[0-9]+$/.test(editingM2MNumber))) {
      toast({
        title: "Error",
        description: "M2M number must be exactly 13 digits.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingM2M(true);
    try {
      const { error } = await supabase
        .from('devices')
        .update({ device_m2m_number: editingM2MNumber.trim() || null })
        .eq('id', deviceId);

      if (error) {
        console.error('Error updating M2M number:', error);
        toast({
          title: "Error",
          description: "Failed to update M2M number.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "M2M number updated successfully.",
        });
        fetchDevices();
        setEditingM2MId(null);
        setEditingM2MNumber('');
      }
    } catch (error) {
      console.error('Error updating M2M number:', error);
      toast({
        title: "Error",
        description: "Failed to update M2M number.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingM2M(false);
    }
  };

  const handleM2MCancel = () => {
    setEditingM2MId(null);
    setEditingM2MNumber('');
  };

  const toggleM2MVisibility = (deviceId: number | string) => {
    setShowM2MNumbers(prev => ({
      ...prev,
      [deviceId]: !prev[deviceId]
    }));
  };

  const confirmDelete = async () => {
    if (!deleteDialog.deviceId) return;

    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deleteDialog.deviceId);

      if (error) {
        console.error('Error deleting device:', error);
        toast({
          title: "Error",
          description: "Failed to delete device.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Device deleted successfully.",
        });
        fetchDevices();
      }
    } catch (error) {
      console.error('Error deleting device:', error);
    } finally {
      setDeleteDialog({ open: false, deviceId: null, deviceCode: '' });
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const takenDevices = devices.filter(device => device.allocated_to_customer_id !== null);
  const notTakenDevices = devices.filter(device => device.allocated_to_customer_id === null);

  const DeviceTable = ({ devices: deviceList, title }: { devices: Device[], title: string }) => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          {title} ({deviceList.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device Code</TableHead>
                <TableHead>M2M Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                {title.includes('Taken') && <TableHead>Allocated To</TableHead>}                {title.includes('Taken') && <TableHead>Allocated At</TableHead>}
                <TableHead className="text-center">QR Code</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deviceList.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-mono text-sm">{device.device_code}</TableCell>
                  <TableCell>
                    {editingM2MId === device.id ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <Input
                            type={showM2MNumbers[`editing-${device.id}`] ? "text" : "password"}
                            value={editingM2MNumber}
                            onChange={(e) => setEditingM2MNumber(e.target.value)}
                            placeholder="Enter 13-digit M2M number"
                            className="w-48 font-mono text-sm pr-10"
                            maxLength={13}
                            autoFocus
                            key={`m2m-input-${device.id}`}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleM2MVisibility(`editing-${device.id}`)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 mr-3"
                          >
                            {showM2MNumbers[`editing-${device.id}`] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleM2MSave(device.id)}
                            disabled={isUpdatingM2M}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleM2MCancel}
                            disabled={isUpdatingM2M}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="font-mono text-sm">
                            {device.device_m2m_number ? (
                              showM2MNumbers[device.id] ? 
                                device.device_m2m_number : 
                                '••••••••••••'
                            ) : (
                              'Not set'
                            )}
                          </span>
                          {device.device_m2m_number && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleM2MVisibility(device.id)}
                              className="ml-2 h-6 w-6 p-0"
                            >
                              {showM2MNumbers[device.id] ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </Button>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleM2MEdit(device)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      device.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {device.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(device.created_at).toLocaleDateString('en-IN')}
                  </TableCell>
                  {title.includes('Taken') && (
                    <TableCell className="font-medium">
                      {device.allocated_to_customer_name || 'N/A'}
                    </TableCell>
                  )}
                  {title.includes('Taken') && (
                    <TableCell>
                      {device.allocated_at 
                        ? new Date(device.allocated_at).toLocaleDateString('en-IN')
                        : 'N/A'
                      }
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex flex-col items-center gap-2">
                      {qrCodes[device.device_code] ? (
                        <img 
                          src={qrCodes[device.device_code]} 
                          alt={`QR Code for ${device.device_code}`}
                          className="border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="w-[120px] h-[120px] border border-gray-300 rounded flex items-center justify-center">
                          <span className="text-gray-500 text-xs">Loading...</span>
                        </div>
                      )}
                      <span className="text-xs text-gray-500 font-mono">
                        Scan to get: {device.device_code}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(device.id, device.device_code)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {deviceList.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No {title.toLowerCase()} devices found.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Device Management
          </CardTitle>
          <CardDescription>
            Generate and manage devices with QR codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="deviceCount">Number of Devices to Generate</Label>
              <Input
                id="deviceCount"
                type="number"
                min="1"
                max="100"
                value={deviceCount}
                onChange={(e) => setDeviceCount(e.target.value)}
                placeholder="1"
              />
            </div>
            <Button 
              onClick={generateDevices}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Devices'}
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Device Overview</h3>
            <Button 
              onClick={fetchDevices}
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
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="not-taken" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="not-taken">Not Taken Devices</TabsTrigger>
          <TabsTrigger value="taken">Taken Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="not-taken">
          <DeviceTable devices={notTakenDevices} title="Not Taken Devices" />
        </TabsContent>

        <TabsContent value="taken">
          <DeviceTable devices={takenDevices} title="Taken Devices" />
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Confirm Delete"
        description={`Are you sure you want to delete "${deleteDialog.deviceCode}"?`}
        onConfirm={confirmDelete}
        confirmText="Ok"
        cancelText="Cancel"
      />
    </>
  );
};

export default DeviceManagement;