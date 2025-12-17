import React, { useState, useEffect } from 'react';
import { FileText, Plus, DollarSign, Calendar } from 'lucide-react';
import axios from 'axios';
import moment from 'moment';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const updateInvoiceStatus = async (invoiceId, newStatus, paymentMethod = null) => {
    try {
      const url = paymentMethod 
        ? `${API}/invoices/${invoiceId}/status?status=${newStatus}&payment_method=${paymentMethod}`
        : `${API}/invoices/${invoiceId}/status?status=${newStatus}`;
      await axios.patch(url);
      toast.success('Rechnungsstatus aktualisiert');
      fetchInvoices();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-rose-100 text-rose-800 border-rose-200'
    };
    return colors[status] || 'bg-stone-100 text-stone-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Ausstehend',
      paid: 'Bezahlt',
      cancelled: 'Storniert'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-stone-600">Rechnungen werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="invoices-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900" data-testid="invoices-title">Rechnungen</h1>
          <p className="text-stone-600 mt-2">Verwalten Sie alle Rechnungen und Zahlungen</p>
        </div>
        <Button className="bg-slate-900 text-white hover:bg-slate-800" data-testid="new-invoice-btn">
          <Plus className="w-4 h-4 mr-2" />
          Neue Rechnung
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-stone-500 font-medium">Ausstehend</span>
          </div>
          <p className="text-3xl font-bold mono text-slate-900">
            {invoices.filter(i => i.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-stone-500 font-medium">Bezahlt</span>
          </div>
          <p className="text-3xl font-bold mono text-slate-900">
            {invoices.filter(i => i.status === 'paid').length}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 rounded-lg">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
            <span className="text-stone-500 font-medium">Gesamtumsatz</span>
          </div>
          <p className="text-3xl font-bold mono text-slate-900">
            €{invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden" data-testid="invoices-table">
        <table className="w-full">
          <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Rechnung-ID</th>
              <th className="px-4 py-3 text-left font-medium">Ausgestellt am</th>
              <th className="px-4 py-3 text-left font-medium">Betrag</th>
              <th className="px-4 py-3 text-left font-medium">Steuer</th>
              <th className="px-4 py-3 text-left font-medium">Gesamt</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Zahlungsmethode</th>
              <th className="px-4 py-3 text-left font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-stone-500">
                  Keine Rechnungen vorhanden
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors" data-testid={`invoice-row-${invoice.id}`}>
                  <td className="px-4 py-3 text-sm text-slate-700 mono">{invoice.id.slice(-8)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-stone-400" />
                      {moment(invoice.issued_at).format('DD.MM.YYYY')}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 mono">€{invoice.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 mono">€{invoice.tax.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900 mono">€{invoice.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(invoice.status)}>
                      {getStatusLabel(invoice.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {invoice.payment_method || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {invoice.status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => updateInvoiceStatus(invoice.id, 'paid', 'Barzahlung')}
                        data-testid={`pay-invoice-${invoice.id}`}
                      >
                        Als bezahlt markieren
                      </Button>
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
