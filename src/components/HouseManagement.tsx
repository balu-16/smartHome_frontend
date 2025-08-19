import React, { useState } from 'react';
import { HouseList } from './HouseList';
import { RoomList } from './RoomList';
import { SwitchList } from './SwitchList';
import { Tables } from '../integrations/supabase/types';

type House = Tables<'houses'>;
type Room = Tables<'rooms'>;

interface HouseManagementProps {
  userId: number;
}

type ViewState = 'houses' | 'rooms' | 'switches';

export const HouseManagement: React.FC<HouseManagementProps> = ({ userId }) => {
  const [currentView, setCurrentView] = useState<ViewState>('houses');
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const handleHouseSelect = (house: House) => {
    setSelectedHouse(house);
    setSelectedRoom(null);
    setCurrentView('rooms');
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setCurrentView('switches');
  };

  const handleBackToHouses = () => {
    setSelectedHouse(null);
    setSelectedRoom(null);
    setCurrentView('houses');
  };

  const handleBackToRooms = () => {
    setSelectedRoom(null);
    setCurrentView('rooms');
  };

  return (
    <div className="container mx-auto p-6">
      {currentView === 'houses' && (
        <HouseList
          userId={userId}
          onHouseSelect={handleHouseSelect}
          selectedHouseId={selectedHouse?.id}
        />
      )}
      
      {currentView === 'rooms' && selectedHouse && (
        <RoomList
          house={selectedHouse}
          onRoomSelect={handleRoomSelect}
          onBackToHouses={handleBackToHouses}
          selectedRoomId={selectedRoom?.id}
        />
      )}
      
      {currentView === 'switches' && selectedRoom && (
        <SwitchList
          room={selectedRoom}
          onBackToRooms={handleBackToRooms}
        />
      )}
    </div>
  );
};

export default HouseManagement;