import React, { useState, useEffect } from 'react';
import { Plus, Home, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { Tables } from '../integrations/supabase/types';

type House = Tables<'houses'>;

interface HouseListProps {
  userId: number;
  onHouseSelect?: (house: House) => void;
  selectedHouseId?: number;
}

export const HouseList: React.FC<HouseListProps> = ({ 
  userId, 
  onHouseSelect, 
  selectedHouseId 
}) => {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [newHouseName, setNewHouseName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchHouses();
  }, [userId]);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setHouses(data || []);
    } catch (error) {
      console.error('Error fetching houses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch houses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddHouse = async () => {
    if (!newHouseName.trim()) {
      toast({
        title: 'Error',
        description: 'House name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('houses')
        .insert({
          user_id: userId,
          house_name: newHouseName.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setHouses([...houses, data]);
      setNewHouseName('');
      setIsAddDialogOpen(false);
      toast({
        title: 'Success',
        description: 'House added successfully',
      });
    } catch (error) {
      console.error('Error adding house:', error);
      toast({
        title: 'Error',
        description: 'Failed to add house',
        variant: 'destructive',
      });
    }
  };

  const handleEditHouse = async () => {
    if (!editingHouse || !newHouseName.trim()) {
      toast({
        title: 'Error',
        description: 'House name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('houses')
        .update({ house_name: newHouseName.trim() })
        .eq('id', editingHouse.id)
        .select()
        .single();

      if (error) throw error;

      setHouses(houses.map(h => h.id === editingHouse.id ? data : h));
      setEditingHouse(null);
      setNewHouseName('');
      setIsEditDialogOpen(false);
      toast({
        title: 'Success',
        description: 'House updated successfully',
      });
    } catch (error) {
      console.error('Error updating house:', error);
      toast({
        title: 'Error',
        description: 'Failed to update house',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteHouse = async (house: House) => {
    if (!confirm(`Are you sure you want to delete "${house.house_name}"? This will also delete all rooms and switches in this house.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('houses')
        .delete()
        .eq('id', house.id);

      if (error) throw error;

      setHouses(houses.filter(h => h.id !== house.id));
      toast({
        title: 'Success',
        description: 'House deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting house:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete house',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (house: House) => {
    setEditingHouse(house);
    setNewHouseName(house.house_name);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading houses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Home className="h-6 w-6" />
          My Houses
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add House
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New House</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="houseName">House Name</Label>
                <Input
                  id="houseName"
                  value={newHouseName}
                  onChange={(e) => setNewHouseName(e.target.value)}
                  placeholder="Enter house name"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddHouse()}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddHouse}>
                  Add House
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {houses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Home className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No houses yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first house
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First House
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {houses.map((house) => (
            <Card 
              key={house.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedHouseId === house.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onHouseSelect?.(house)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    <span className="truncate">{house.house_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(house);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHouse(house);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(house.created_at || '').toLocaleDateString()}
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
            <DialogTitle>Edit House</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editHouseName">House Name</Label>
              <Input
                id="editHouseName"
                value={newHouseName}
                onChange={(e) => setNewHouseName(e.target.value)}
                placeholder="Enter house name"
                onKeyPress={(e) => e.key === 'Enter' && handleEditHouse()}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditHouse}>
                Update House
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HouseList;