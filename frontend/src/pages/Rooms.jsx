import React, { useState, useEffect } from 'react';
import { Plus, Hotel, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API}/rooms`);
      setRooms(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Zimmer');
    } finally {
      setLoading(false);
    }
  };

  const updateRoomStatus = async (roomId, newStatus) => {
    try {
      await axios.patch(`${API}/rooms/${roomId}/status?status=${newStatus}`);
      toast.success('Zimmerstatus aktualisiert');
      fetchRooms();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm('Möchten Sie dieses Zimmer wirklich löschen?')) return;
    
    try {
      await axios.delete(`${API}/rooms/${roomId}`);
      toast.success('Zimmer gelöscht');
      fetchRooms();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      occupied: 'bg-rose-100 text-rose-800 border-rose-200',
      cleaning: 'bg-amber-100 text-amber-800 border-amber-200',
      maintenance: 'bg-stone-100 text-stone-800 border-stone-200'
    };
    return colors[status] || 'bg-stone-100 text-stone-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      available: 'Verfügbar',
      occupied: 'Belegt',
      cleaning: 'Reinigung',
      maintenance: 'Wartung'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-stone-600">Zimmer werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="rooms-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900" data-testid="rooms-title">Zimmerverwaltung</h1>
          <p className="text-stone-600 mt-2">Verwalten Sie alle Zimmer und deren Status</p>
        </div>
        <Button className="bg-slate-900 text-white hover:bg-slate-800" data-testid="new-room-btn">
          <Plus className="w-4 h-4 mr-2" />
          Neues Zimmer
        </Button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="rooms-grid">
        {rooms.length === 0 ? (
          <div className="col-span-full text-center py-12 text-stone-500">
            Keine Zimmer vorhanden. Fügen Sie Ihr erstes Zimmer hinzu.
          </div>
        ) : (
          rooms.map((room) => (
            <div key={room.id} className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow" data-testid={`room-card-${room.id}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-900 rounded-lg">
                  <Hotel className="w-6 h-6 text-white" />
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-stone-100 rounded-lg transition-colors" data-testid={`edit-room-${room.id}`}>
                    <Edit className="w-4 h-4 text-stone-600" />
                  </button>
                  <button 
                    onClick={() => deleteRoom(room.id)}
                    className="p-2 hover:bg-rose-100 rounded-lg transition-colors"
                    data-testid={`delete-room-${room.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-2 mono">Zimmer {room.room_number}</h3>
              <p className="text-sm text-stone-600 mb-3">Etage {room.floor}</p>
              
              <Badge className={`${getStatusColor(room.status)} mb-4`}>
                {getStatusLabel(room.status)}
              </Badge>
              
              <div className="mt-4 pt-4 border-t border-stone-200">
                <label className="text-xs text-stone-500 font-medium mb-2 block">Status ändern</label>
                <Select
                  value={room.status}
                  onValueChange={(value) => updateRoomStatus(room.id, value)}
                >
                  <SelectTrigger className="w-full" data-testid={`status-select-${room.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Verfügbar</SelectItem>
                    <SelectItem value="occupied">Belegt</SelectItem>
                    <SelectItem value="cleaning">Reinigung</SelectItem>
                    <SelectItem value="maintenance">Wartung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {room.notes && (
                <div className="mt-3 p-3 bg-stone-50 rounded text-xs text-stone-600">
                  {room.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
