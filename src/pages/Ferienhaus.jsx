import React, { useState, useEffect } from 'react';
import { TreePine, CheckCircle, Clock, AlertTriangle, Home, Plus, UserPlus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BACKEND_URL = `${window.location.protocol}//${window.location.hostname}:8001`;
const API = `${BACKEND_URL}/api`;

export default function Ferienhaus() {
  const [cottage, setCottage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [guests, setGuests] = useState([]);
  const [showNewGuestForm, setShowNewGuestForm] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');

  const [newBooking, setNewBooking] = useState({
    guest_id: '',
    room_id: '',
    check_in: '',
    check_out: '',
    status: 'confirmed'
  });

  useEffect(() => {
    fetchCottage();
    fetchGuests();
  }, []);

  const fetchCottage = async () => {
    try {
      const response = await axios.get(`${API}/rooms`);
      const found = response.data.find(r => 
        r.type?.toLowerCase().includes('ferienhaus') || 
        r.room_number?.toString().toLowerCase().includes('ferienhaus')
      );
      setCottage(found);
      if (found) {
        setNewBooking(prev => ({ ...prev, room_id: found.id }));
      }
    } catch (error) {
      toast.error('Fehler beim Laden des Objekts');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuests = async () => {
    try {
      const response = await axios.get(`${API}/guests`);
      setGuests(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Gäste');
    }
  };

  const handleCreateGuest = async () => {
    if (!newGuestName) return toast.error('Name fehlt');
    try {
      const response = await axios.post(`${API}/guests`, { 
        first_name: newGuestName, 
        last_name: '(Neu)', 
        email: `neu_${Date.now()}@hotel.de` 
      });
      toast.success('Gast angelegt');
      setGuests([...guests, response.data]);
      setNewBooking({ ...newBooking, guest_id: response.data.id.toString() });
      setShowNewGuestForm(false);
      setNewGuestName('');
    } catch (error) {
      toast.error('Fehler beim Anlegen');
    }
  };

  const handleCreateBooking = async () => {
    if (!newBooking.guest_id || !newBooking.check_in || !newBooking.check_out) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }
    try {
      await axios.post(`${API}/bookings`, newBooking);
      toast.success('Buchung erfolgreich');
      setIsDialogOpen(false);
      setNewBooking({ ...newBooking, guest_id: '', check_in: '', check_out: '' });
      fetchCottage();
    } catch (error) {
      toast.error('Fehler beim Buchen');
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await axios.patch(`${API}/rooms/${cottage.id}/status?status=${newStatus}`);
      toast.success('Status aktualisiert');
      fetchCottage();
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  };

  if (loading) return <div className="p-8 text-center">Lädt...</div>;
  if (!cottage) return <div className="p-8 text-center">Kein Ferienhaus gefunden.</div>;

  return (
    <div className="p-8 bg-stone-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            <TreePine className="w-10 h-10 text-emerald-600" /> Ferienhaus
          </h1>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Neue Reservierung
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] w-[95vw] bg-white border shadow-2xl">
            <DialogHeader><DialogTitle className="text-2xl font-bold border-b pb-4">Buchung für {cottage.room_number}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
              <div className="space-y-6">
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700">Gast auswählen</label>
                    <button onClick={() => setShowNewGuestForm(!showNewGuestForm)} className="text-xs text-blue-600 flex items-center">
                      <UserPlus className="w-3 h-3 mr-1" /> {showNewGuestForm ? "Abbrechen" : "Neuer Gast"}
                    </button>
                  </div>
                  {showNewGuestForm ? (
                    <div className="flex gap-2">
                      <Input placeholder="Name" value={newGuestName} onChange={(e) => setNewGuestName(e.target.value)} className="h-12" />
                      <Button onClick={handleCreateGuest} className="h-12 bg-blue-600 text-white">Speichern</Button>
                    </div>
                  ) : (
                    <Select value={newBooking.guest_id} onValueChange={(val) => setNewBooking({...newBooking, guest_id: val})}>
                      <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Gast suchen..." /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {guests.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.first_name} {g.last_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="grid gap-2 opacity-50">
                  <label className="text-sm font-semibold text-slate-700">Zimmer</label>
                  <Input value={cottage.room_number} disabled className="h-12 bg-stone-50" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid gap-2"><label className="text-sm font-semibold text-slate-700">Check-In</label>
                <Input type="date" className="h-12" value={newBooking.check_in} onChange={(e) => setNewBooking({...newBooking, check_in: e.target.value})} /></div>
                <div className="grid gap-2"><label className="text-sm font-semibold text-slate-700">Check-Out</label>
                <Input type="date" className="h-12" value={newBooking.check_out} onChange={(e) => setNewBooking({...newBooking, check_out: e.target.value})} /></div>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-6 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="px-8">Abbrechen</Button>
              <Button onClick={handleCreateBooking} className="bg-blue-600 hover:bg-blue-700 text-white px-12 font-bold">Buchen</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="max-w-xl bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div><h2 className="text-3xl font-bold">{cottage.room_number}</h2><p className="opacity-70">{cottage.type}</p></div>
          <div className={`p-4 rounded-full ${cottage.status === 'available' ? 'bg-emerald-500' : 'bg-rose-500'}`}><Home className="w-8 h-8" /></div>
        </div>
        <div className="p-8">
          <div className="mb-8">
            <span className="text-sm font-bold text-stone-400 uppercase tracking-widest">Status</span>
            <div className={`mt-2 text-2xl font-bold ${cottage.status === 'available' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {cottage.status === 'available' ? 'FREI' : 'BELEGT'}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <button onClick={() => updateStatus('available')} className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold flex items-center justify-center gap-2"><CheckCircle /> Frei</button>
            <button onClick={() => updateStatus('occupied')} className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-center justify-center gap-2"><Clock /> Belegt</button>
            <button onClick={() => updateStatus('cleaning')} className="p-4 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold flex items-center justify-center gap-2"><AlertTriangle /> Reinigung</button>
          </div>
        </div>
      </div>
    </div>
  );
}
