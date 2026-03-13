import React, { useState, useEffect } from 'react';
import { FileText, Plus, DollarSign, Calendar } from 'lucide-react';
import axios from 'axios';
import moment from 'moment';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const BACKEND_URL = `${window.location.protocol}//${window.location.hostname}:8001`;
const API = `${BACKEND_URL}/api`;

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ booking_id: '', amount: '' });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API}/invoices`);
      setInvoices(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Rechnungen');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      await axios.post(`${API}/invoices`, newInvoice);
      toast.success('Rechnung erstellt');
      setIsDialogOpen(false);
      fetchInvoices();
    } catch (error) {
      toast.error('Fehler: Buchungs-ID evtl. ungültig');
    }
  };

  const updateInvoiceStatus = async (invoiceId, newStatus) => {
    try {
      await axios.patch(`${API}/invoices/${invoiceId}/status?status=${newStatus}`);
      toast.success('Rechnung als bezahlt markiert');
      fetchInvoices();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Rechnungen</h1>
          <p className="text-stone-600 mt-2">Zahlungen und Belege verwalten</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" /> Neue Rechnung
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader><DialogTitle>Rechnung erstellen</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <Input placeholder="Buchungs-ID (Zahl)" type="number" onChange={(e) => setNewInvoice({...newInvoice, booking_id: e.target.value})} />
              <Input placeholder="Betrag (€)" type="number" onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})} />
              <Button onClick={handleCreateInvoice} className="bg-blue-600 text-white">Erstellen</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-stone-600">Rechnungs-Nr.</th>
              <th className="px-6 py-4 text-sm font-semibold text-stone-600">Datum</th>
              <th className="px-6 py-4 text-sm font-semibold text-stone-600">Gesamt</th>
              <th className="px-6 py-4 text-sm font-semibold text-stone-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-stone-600">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-8 text-stone-500">Lädt...</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-stone-50">
                  <td className="px-6 py-4 font-mono font-medium">#INV-{inv.id}</td>
                  <td className="px-6 py-4 text-stone-600">{moment(inv.issued_at).format('DD.MM.YYYY')}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">€{inv.total?.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <Badge className={inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                      {inv.status === 'paid' ? 'Bezahlt' : 'Offen'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {inv.status !== 'paid' && (
                      <Button size="sm" onClick={() => updateInvoiceStatus(inv.id, 'paid')} className="bg-emerald-600 text-white text-xs">Bezahlen</Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
