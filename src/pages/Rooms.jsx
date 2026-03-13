import React, { useState, useEffect } from 'react';
import { Plus, Hotel, Edit, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BACKEND_URL = `${window.location.protocol}//${window.location.hostname}:8001`;
const API = `${BACKEND_URL}/api`;

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newRoom, setNewRoom] = useState({ 
    room_number: '', 
    type: 'Einzelzimmer', 
    price_per_night: '80' 
  });

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API}/rooms`);
      setRooms(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  // ZENTRALE FILTERUNG: Nur echte Hotelzimmer, keine Ferienhäuser
  const hotelRooms = rooms.filter(room => 
    !room.room_number?.toString().toLowerCase().includes('ferienhaus') &&
    !room.type?.toLowerCase().includes('ferienhaus')
  );

  const allHotelRoomsBelegt = hotelRooms.length > 0 && 
    hotelRooms.every(room => room.status === 'occupied' || room.status === 'belegt');

  const handleToggleAllStatus = async () => {
    const newStatus = allHotelRoomsBelegt ? 'available' : 'occupied';
    const actionText = allHotelRoomsBelegt ? "FREIGEBEN" : "auf BELEGT setzen";
    
    if (!window.confirm(`Möchten Sie alle Hotelzimmer ${actionText}?`)) return;

    try {
      toast.info("Verarbeitung läuft...");
      await Promise.all(hotelRooms.map(room => 
        axios.patch(`${API}/rooms/${room.id}/status?status=${newStatus}`)
      ));
      toast.success(allHotelRoomsBelegt ? "Alle Zimmer frei!" : "Alle Zimmer belegt!");
      fetchRooms();
    } catch (error) {
      toast.error("Fehler beim Umschalten!");
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoom.room_number) return toast.error('Bitte Zimmernummer angeben');
    try {
      await axios.post(`${API}/rooms`, { ...newRoom, floor: 0 });
      toast.success('Zimmer erfolgreich angelegt');
      setNewRoom({ room_number: '', type: 'Einzelzimmer', price_per_night: '80' });
      fetchRooms();
    } catch (error) {
      toast.error('Fehler beim Erstellen');
    }
  };

  const updateRoomStatus = async (roomId, newStatus) => {
    try {
      await axios.patch(`${API}/rooms/${roomId}/status?status=${newStatus}`);
      toast.success('Status aktualisiert');
      fetchRooms();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm('Zimmer wirklich löschen?')) return;
    try {
      await axios.delete(`${API}/rooms/${roomId}`);
      toast.success('Zimmer gelöscht');
      fetchRooms();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    const colors = {
      available: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      frei: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      occupied: 'bg-rose-100 text-rose-800 border-rose-200',
      belegt: 'bg-rose-100 text-rose-800 border-rose-200',
      cleaning: 'bg-amber-100 text-amber-800 border-amber-200',
      reinigung: 'bg-amber-100 text-amber-800 border-amber-200',
      maintenance: 'bg-stone-100 text-stone-800 border-stone-200',
      wartung: 'bg-stone-100 text-stone-800 border-stone-200'
    };
    return colors[s] || 'bg-stone-100 text-stone-800';
  };

  const getStatusLabel = (status) => {
    const s = status?.toLowerCase();
    const labels = { available: 'Frei', frei: 'Frei', occupied: 'Belegt', belegt: 'Belegt', cleaning: 'Reinigung', reinigung: 'Reinigung', maintenance: 'Wartung', wartung: 'Wartung' };
    return labels[s] || status;
  };

  if (loading) return <div className="p-8 text-center">Lädt...</div>;

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Zimmerverwaltung</h1>
          <p className="text-stone-600 mt-2">Nur Hotelzimmer (Ferienhaus wird separat verwaltet)</p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
          <Button 
            variant="outline"
            onClick={handleToggleAllStatus}
            className={`mr-2 ${allHotelRoomsBelegt ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' : 'text-rose-600 border-rose-200 hover:bg-rose-50'}`}
          >
            {allHotelRoomsBelegt ? <RefreshCw className="w-4 h-4 mr-1" /> : <AlertTriangle className="w-4 h-4 mr-1" />}
            {allHotelRoomsBelegt ? "Alle freigeben" : "Alle belegt"}
          </Button>

          <Input placeholder="Zimmer-Nr." className="w-32" value={newRoom.room_number} onChange={(e) => setNewRoom({...newRoom, room_number: e.target.value})} />
          <select 
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newRoom.type}
            onChange={(e) => {
              const val = e.target.value;
              const price = val === 'Einzelzimmer' ? '80' : val === 'Doppelzimmer' ? '120' : '250';
              setNewRoom({...newRoom, type: val, price_per_night: price});
            }}
          >
            <option value="Einzelzimmer">Einzelzimmer</option>
            <option value="Doppelzimmer">Doppelzimmer</option>
            <option value="Suite">Suite</option>
          </select>
          <Input placeholder="Preis" type="number" className="w-24" value={newRoom.price_per_night} onChange={(e) => setNewRoom({...newRoom, price_per_night: e.target.value})} />
          <Button onClick={handleCreateRoom} className="bg-slate-900 text-white"><Plus className="w-4 h-4 mr-1" /> Hinzufügen</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {hotelRooms.map((room) => (
          <div key={room.id} className="bg-white border border-stone-200 rounded-lg shadow-sm p-6">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-slate-900 rounded-lg"><Hotel className="w-6 h-6 text-white" /></div>
              <div className="flex gap-2">
                <button onClick={() => deleteRoom(room.id)} className="p-2 hover:bg-rose-100 rounded-lg text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">Zimmer {room.room_number}</h3>
            <p className="text-sm text-stone-500 mb-3">{room.type} • {room.price_per_night} €</p>
            <Badge className={`${getStatusColor(room.status)} mb-4`}>{getStatusLabel(room.status)}</Badge>
            <div className="mt-4 pt-4 border-t">
              <label className="text-xs text-stone-500 block mb-2">Status ändern</label>
              <Select value={room.status} onValueChange={(val) => updateRoomStatus(room.id, val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Frei</SelectItem>
                  <SelectItem value="occupied">Belegt</SelectItem>
                  <SelectItem value="cleaning">Reinigung</SelectItem>
                  <SelectItem value="maintenance">Wartung</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
