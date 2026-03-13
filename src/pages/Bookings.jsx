import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, Search, Filter, UserPlus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

moment.locale('de');
const localizer = momentLocalizer(moment);

const BACKEND_URL = `${window.location.protocol}//${window.location.hostname}:8001`;
const API = `${BACKEND_URL}/api`;

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');

  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showNewGuestForm, setShowNewGuestForm] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newBooking, setNewBooking] = useState({
    guest_id: '',
    room_id: '',
    check_in: '',
    check_out: '',
    num_guests: 1,
    total_price: 0,
    status: 'confirmed'
  });

  const [newGuest, setNewGuest] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, gRes, rRes] = await Promise.all([
        axios.get(`${API}/bookings`),
        axios.get(`${API}/guests`),
        axios.get(`${API}/rooms`)
      ]);
      
      // Verknüpfe die IDs mit Namen für die Anzeige
      const enrichedBookings = bRes.data.map(b => {
        const guest = gRes.data.find(g => g.id === b.guest_id);
        const room = rRes.data.find(r => r.id === b.room_id);
        return {
          ...b,
          guest_name: guest ? `${guest.first_name} ${guest.last_name}` : 'Unbekannter Gast',
          room_number: room ? room.room_number : '?'
        };
      });

      setBookings(enrichedBookings);
      setFilteredBookings(enrichedBookings);
      setGuests(gRes.data);
      setRooms(rRes.data);
    } catch (e) {
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = bookings;
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }
    if (searchTerm) {
      result = result.filter(b => 
        b.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.room_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredBookings(result);
  }, [searchTerm, statusFilter, bookings]);

  const handleCreateGuest = async () => {
    try {
      const res = await axios.post(`${API}/guests`, newGuest);
      setGuests([...guests, res.data]);
      setNewBooking({ ...newBooking, guest_id: res.data.id });
      setShowNewGuestForm(false);
      toast.success('Gast angelegt');
    } catch (e) {
      toast.error('Fehler beim Anlegen des Gastes');
    }
  };

  const handleCreateBooking = async () => {
    if (!newBooking.guest_id || !newBooking.room_id || !newBooking.check_in || !newBooking.check_out) {
      return toast.error('Daten unvollständig');
    }
    try {
      // Formatiere Daten für das Backend (ISO-String)
      const payload = {
        ...newBooking,
        check_in: new Date(newBooking.check_in).toISOString(),
        check_out: new Date(newBooking.check_out).toISOString(),
        num_guests: parseInt(newBooking.num_guests) || 1,
        total_price: parseFloat(newBooking.total_price) || 0
      };

      await axios.post(`${API}/bookings`, payload);
      toast.success('Buchung erstellt');
      setIsDialogOpen(false);
      fetchData(); // Komplett neu laden um Namen zu verknüpfen
      setNewBooking({
        guest_id: '', room_id: '', check_in: '', check_out: '', 
        num_guests: 1, total_price: 0, status: 'confirmed'
      });
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Fehler beim Erstellen');
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      // In der aktuellen server.py gibt es keinen PATCH /bookings/{id} Endpunkt, 
      // dieser müsste ggf. noch in der server.py ergänzt werden.
      // Falls nicht vorhanden, wird dieser Aufruf einen 404 werfen.
      await axios.patch(`${API}/bookings/${id}/status`, null, { params: { status } });
      toast.success('Status aktualisiert');
      fetchData();
    } catch (e) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      confirmed: <Badge className="bg-blue-100 text-blue-700">Bestätigt</Badge>,
      checked_in: <Badge className="bg-green-100 text-green-700">Eingecheckt</Badge>,
      checked_out: <Badge className="bg-stone-100 text-stone-700">Ausgecheckt</Badge>,
      cancelled: <Badge className="bg-red-100 text-red-700">Storniert</Badge>
    };
    return map[status] || <Badge>{status}</Badge>;
  };

  const calendarEvents = bookings.map(b => ({
    id: b.id,
    title: `${b.room_number}: ${b.guest_name}`,
    start: new Date(b.check_in),
    end: new Date(b.check_out),
    resource: b.status
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Buchungen</h1>
          <p className="text-stone-500">Zimmerbelegungen und Reservierungen</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-stone-900 text-white hover:bg-stone-800">
              <Plus className="w-4 h-4 mr-2" /> Neue Buchung
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white">
            <DialogHeader>
              <DialogTitle>Neue Buchung anlegen</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!showNewGuestForm ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Gast auswählen</label>
                    <Button variant="link" size="sm" onClick={() => setShowNewGuestForm(true)}>
                      <UserPlus className="w-3 h-3 mr-1" /> Neu
                    </Button>
                  </div>
                  <Select onValueChange={(val) => setNewBooking({...newBooking, guest_id: val})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Gast suchen..." /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {guests.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.first_name} {g.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-3 p-3 border rounded-lg bg-stone-50">
                  <Input placeholder="Vorname" onChange={(e) => setNewGuest({...newGuest, first_name: e.target.value})} />
                  <Input placeholder="Nachname" onChange={(e) => setNewGuest({...newGuest, last_name: e.target.value})} />
                  <Input placeholder="Email" onChange={(e) => setNewGuest({...newGuest, email: e.target.value})} />
                  <Input placeholder="Telefon" onChange={(e) => setNewGuest({...newGuest, phone: e.target.value})} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateGuest}>Speichern</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowNewGuestForm(false)}>Abbrechen</Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Zimmer</label>
                <Select onValueChange={(val) => setNewBooking({...newBooking, room_id: val})}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Zimmer auswählen" /></SelectTrigger>
                  <SelectContent className="bg-white">
                    {rooms.map(r => (
                      <SelectItem key={r.id} value={r.id}>Zimmer {r.room_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Check-in</label>
                  <Input type="date" onChange={(e) => setNewBooking({...newBooking, check_in: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Check-out</label>
                  <Input type="date" onChange={(e) => setNewBooking({...newBooking, check_out: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Personen</label>
                  <Input type="number" min="1" value={newBooking.num_guests} onChange={(e) => setNewBooking({...newBooking, num_guests: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gesamtpreis (€)</label>
                  <Input type="number" step="0.01" value={newBooking.total_price} onChange={(e) => setNewBooking({...newBooking, total_price: e.target.value})} />
                </div>
              </div>

              <Button className="w-full mt-4 bg-stone-900 text-white" onClick={handleCreateBooking}>
                Buchung speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 border rounded-lg">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input 
            className="pl-10 bg-stone-50 border-stone-200" 
            placeholder="Nach Gast oder Zimmer suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-white border-stone-200">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="confirmed">Bestätigt</SelectItem>
              <SelectItem value="checked_in">Eingecheckt</SelectItem>
              <SelectItem value="checked_out">Ausgecheckt</SelectItem>
              <SelectItem value="cancelled">Storniert</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg p-1 bg-stone-100">
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
              onClick={() => setViewMode('list')}
            >Liste</Button>
            <Button 
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={viewMode === 'calendar' ? 'bg-white shadow-sm' : ''}
              onClick={() => setViewMode('calendar')}
            >Kalender</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">Lade Buchungen...</div>
      ) : viewMode === 'list' ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-stone-600">Gast</th>
                <th className="px-6 py-4 font-semibold text-stone-600">Zimmer</th>
                <th className="px-6 py-4 font-semibold text-stone-600">Zeitraum</th>
                <th className="px-6 py-4 font-semibold text-stone-600">Status</th>
                <th className="px-6 py-4 font-semibold text-stone-600">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-stone-50">
                  <td className="px-6 py-4 font-medium">{b.guest_name}</td>
                  <td className="px-6 py-4">Zimmer {b.room_number}</td>
                  <td className="px-6 py-4">
                    {moment(b.check_in).format('DD.MM.')} - {moment(b.check_out).format('DD.MM.YYYY')}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(b.status)}</td>
                  <td className="px-6 py-4">
                    <Select value={b.status} onValueChange={(val) => updateBookingStatus(b.id, val)}>
                      <SelectTrigger className="w-32 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="confirmed">Bestätigt</SelectItem>
                        <SelectItem value="checked_in">Eingecheckt</SelectItem>
                        <SelectItem value="checked_out">Ausgecheckt</SelectItem>
                        <SelectItem value="cancelled">Storniert</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-6 h-[700px]">
          <BigCalendar 
            localizer={localizer} 
            events={calendarEvents} 
            startAccessor="start" 
            endAccessor="end" 
            style={{ height: '100%' }}
            messages={{
              next: "Weiter",
              previous: "Zurück",
              today: "Heute",
              month: "Monat",
              week: "Woche",
              day: "Tag"
            }}
          />
        </div>
      )}
    </div>
  );
}
