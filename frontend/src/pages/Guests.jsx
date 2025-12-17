import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Mail, Phone } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Guests() {
  const [guests, setGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    id_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchGuests();
  }, []);

  useEffect(() => {
    filterGuests();
  }, [guests, searchTerm]);

  const fetchGuests = async () => {
    try {
      const response = await axios.get(`${API}/guests`);
      setGuests(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Gäste');
    } finally {
      setLoading(false);
    }
  };

  const filterGuests = () => {
    if (!searchTerm) {
      setFilteredGuests(guests);
      return;
    }
    
    const filtered = guests.filter(g => 
      g.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.phone.includes(searchTerm)
    );
    
    setFilteredGuests(filtered);
  };

  const handleCreateGuest = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/guests`, formData);
      toast.success('Gast erfolgreich hinzugefügt');
      setIsDialogOpen(false);
      resetForm();
      fetchGuests();
    } catch (error) {
      toast.error('Fehler beim Hinzufügen des Gastes');
    }
  };

  const deleteGuest = async (guestId) => {
    if (!window.confirm('Möchten Sie diesen Gast wirklich löschen?')) return;
    
    try {
      await axios.delete(`${API}/guests/${guestId}`);
      toast.success('Gast gelöscht');
      fetchGuests();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      id_number: '',
      notes: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-stone-600">Gäste werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="guests-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900" data-testid="guests-title">Gästeverwaltung</h1>
          <p className="text-stone-600 mt-2">Verwalten Sie alle Gastinformationen</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white hover:bg-slate-800" data-testid="new-guest-btn">
              <Plus className="w-4 h-4 mr-2" />
              Neuer Gast
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" data-testid="guest-dialog">
            <DialogHeader>
              <DialogTitle>Neuen Gast hinzufügen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGuest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vorname *</Label>
                  <Input
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label>Nachname *</Label>
                  <Input
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>E-Mail *</Label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label>Telefon *</Label>
                  <Input
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    data-testid="input-phone"
                  />
                </div>
              </div>
              <div>
                <Label>Adresse</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  data-testid="input-address"
                />
              </div>
              <div>
                <Label>Ausweisnummer</Label>
                <Input
                  value={formData.id_number}
                  onChange={(e) => setFormData({...formData, id_number: e.target.value})}
                  data-testid="input-id-number"
                />
              </div>
              <div>
                <Label>Notizen</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  data-testid="input-notes"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800" data-testid="submit-guest-btn">
                  Gast hinzufügen
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Suche nach Name, E-Mail oder Telefon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-guests-input"
          />
        </div>
      </div>

      {/* Guests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="guests-grid">
        {filteredGuests.length === 0 ? (
          <div className="col-span-full text-center py-12 text-stone-500">
            Keine Gäste gefunden
          </div>
        ) : (
          filteredGuests.map((guest) => (
            <div key={guest.id} className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow" data-testid={`guest-card-${guest.id}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  {guest.first_name[0]}{guest.last_name[0]}
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-stone-100 rounded-lg transition-colors" data-testid={`edit-guest-${guest.id}`}>
                    <Edit className="w-4 h-4 text-stone-600" />
                  </button>
                  <button 
                    onClick={() => deleteGuest(guest.id)}
                    className="p-2 hover:bg-rose-100 rounded-lg transition-colors"
                    data-testid={`delete-guest-${guest.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{guest.first_name} {guest.last_name}</h3>
              <div className="space-y-2 text-sm text-stone-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{guest.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{guest.phone}</span>
                </div>
                {guest.address && (
                  <div className="text-xs mt-2 pt-2 border-t border-stone-200">
                    {guest.address}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
