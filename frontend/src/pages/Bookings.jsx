import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, Plus, Search, Filter } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

moment.locale('de');
const localizer = momentLocalizer(moment);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings`);
      setBookings(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Buchungen');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.guest_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      await axios.patch(`${API}/bookings/${bookingId}/status?status=${newStatus}`);
      toast.success('Buchungsstatus aktualisiert');
      fetchBookings();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      checked_in: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      checked_out: 'bg-stone-100 text-stone-800 border-stone-200',
      cancelled: 'bg-rose-100 text-rose-800 border-rose-200'
    };
    return colors[status] || 'bg-stone-100 text-stone-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      confirmed: 'Bestätigt',
      checked_in: 'Eingecheckt',
      checked_out: 'Ausgecheckt',
      cancelled: 'Storniert'
    };
    return labels[status] || status;
  };

  const calendarEvents = bookings.map(booking => ({
    id: booking.id,
    title: `Zimmer ${booking.room_id.slice(-4)}`,
    start: new Date(booking.check_in),
    end: new Date(booking.check_out),
    resource: booking
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-stone-600">Buchungen werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="bookings-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900" data-testid="bookings-title">Buchungen</h1>
          <p className="text-stone-600 mt-2">Verwalten Sie alle Reservierungen</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            variant="outline"
            data-testid="toggle-view-btn"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {viewMode === 'list' ? 'Kalenderansicht' : 'Listenansicht'}
          </Button>
          <Button className="bg-slate-900 text-white hover:bg-slate-800" data-testid="new-booking-btn">
            <Plus className="w-4 h-4 mr-2" />
            Neue Buchung
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                type="text"
                placeholder="Suche nach Buchungs-ID oder Gast..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-bookings-input"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="status-filter-select">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="confirmed">Bestätigt</SelectItem>
              <SelectItem value="checked_in">Eingecheckt</SelectItem>
              <SelectItem value="checked_out">Ausgecheckt</SelectItem>
              <SelectItem value="cancelled">Storniert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === 'list' ? (
        /* List View */
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden" data-testid="bookings-list">
          <table className="w-full">
            <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Buchungs-ID</th>
                <th className="px-4 py-3 text-left font-medium">Check-in</th>
                <th className="px-4 py-3 text-left font-medium">Check-out</th>
                <th className="px-4 py-3 text-left font-medium">Zimmer</th>
                <th className="px-4 py-3 text-left font-medium">Gäste</th>
                <th className="px-4 py-3 text-left font-medium">Preis</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-stone-500">
                    Keine Buchungen gefunden
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors" data-testid={`booking-row-${booking.id}`}>
                    <td className="px-4 py-3 text-sm text-slate-700 mono">{booking.id.slice(-8)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{moment(booking.check_in).format('DD.MM.YYYY')}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{moment(booking.check_out).format('DD.MM.YYYY')}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 mono">{booking.room_id.slice(-4)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{booking.num_guests}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 mono">€{booking.total_price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={booking.status}
                        onValueChange={(value) => updateBookingStatus(booking.id, value)}
                      >
                        <SelectTrigger className="w-32" data-testid={`status-change-${booking.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Bestätigt</SelectItem>
                          <SelectItem value="checked_in">Eingecheckt</SelectItem>
                          <SelectItem value="checked_out">Ausgecheckt</SelectItem>
                          <SelectItem value="cancelled">Storniert</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6" style={{ height: '700px' }} data-testid="bookings-calendar">
          <BigCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            messages={{
              next: 'Weiter',
              previous: 'Zurück',
              today: 'Heute',
              month: 'Monat',
              week: 'Woche',
              day: 'Tag',
              agenda: 'Agenda'
            }}
          />
        </div>
      )}
    </div>
  );
}
