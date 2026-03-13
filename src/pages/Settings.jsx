import React, { useState, useEffect } from 'react';
import { Hotel, Mail, Globe, Bell, Shield, DollarSign, TreePine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function Settings() {
  const [settings, setSettings] = useState({
    hotelName: 'HotelPro',
    email: 'info@hotelpro.de',
    phone: '+49 123 456789',
    address: 'Musterstraße 123, 12345 Musterstadt',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    emailNotifications: true,
    bookingAlerts: true,
    resendApiKey: '',
    senderEmail: 'onboarding@resend.dev',
    defaultPriceSingle: '80',
    defaultPriceDouble: '120',
    defaultPriceCottage: '150'
  });

  // --- DATEN LADEN BEIM START ---
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data) setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error("Fehler beim Laden:", error);
      }
    };
    loadSettings();
  }, []);

  // --- SPEICHER-FUNKTION ---
  const handleSave = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        toast.success('Einstellungen und Preise gespeichert');
      } else {
        toast.error('Fehler beim Speichern');
      }
    } catch (error) {
      toast.error('Server nicht erreichbar');
    }
  };

  return (
    <div className="p-8" data-testid="settings-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Einstellungen</h1>
        <p className="text-slate-500 mt-2">Verwalten Sie Ihre Hotel-Konfiguration und Standardpreise.</p>
      </div>

      <div className="max-w-4xl space-y-8">
        {/* Sektion 1: Allgemeine Informationen */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Allgemeine Informationen</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="hotelName">Hotel Name</Label>
              <Input 
                id="hotelName" 
                value={settings.hotelName} 
                onChange={(e) => setSettings({...settings, hotelName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Kontakt Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={settings.email}
                onChange={(e) => setSettings({...settings, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input 
                id="phone" 
                value={settings.phone}
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input 
                id="address" 
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Sektion 2: Zimmerpreise */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-900 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Standard-Zimmerpreise</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="priceSingle">Einzelzimmer (€)</Label>
              <Input 
                id="priceSingle" 
                type="number" 
                value={settings.defaultPriceSingle}
                onChange={(e) => setSettings({...settings, defaultPriceSingle: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceDouble">Doppelzimmer (€)</Label>
              <Input 
                id="priceDouble" 
                type="number" 
                value={settings.defaultPriceDouble}
                onChange={(e) => setSettings({...settings, defaultPriceDouble: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceCottage">Ferienhaus (€)</Label>
              <Input 
                id="priceCottage" 
                type="number" 
                value={settings.defaultPriceCottage}
                onChange={(e) => setSettings({...settings, defaultPriceCottage: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Sektion 3: Benachrichtigungen */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Benachrichtigungen</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email-Benachrichtigungen</Label>
                <p className="text-sm text-slate-500">Tägliche Zusammenfassungen erhalten</p>
              </div>
              <Switch 
                checked={settings.emailNotifications}
                onCheckedChange={(val) => setSettings({...settings, emailNotifications: val})}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Buchungs-Alarme</Label>
                <p className="text-sm text-slate-500">Sofort-Info bei neuen Buchungen</p>
              </div>
              <Switch 
                checked={settings.bookingAlerts}
                onCheckedChange={(val) => setSettings({...settings, bookingAlerts: val})}
              />
            </div>
          </div>
        </div>

        {/* Sektion 4: E-Mail Versand (Resend) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">E-Mail Versand (Resend)</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Resend API Key</Label>
              <Input 
                id="apiKey" 
                type="password" 
                placeholder="re_..."
                value={settings.resendApiKey}
                onChange={(e) => setSettings({...settings, resendApiKey: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderEmail">Absender E-Mail</Label>
              <Input 
                id="senderEmail" 
                value={settings.senderEmail}
                onChange={(e) => setSettings({...settings, senderEmail: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Sektion 5: Booking.com Integration */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Booking.com Integration</h2>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800 italic">Integration vorbereitet, erfordert Booking.com API-Key.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 opacity-50">
            <div className="space-y-2">
              <Label>Client ID</Label>
              <Input disabled placeholder="Noch nicht konfiguriert" />
            </div>
            <div className="space-y-2">
              <Label>Client Secret</Label>
              <Input disabled type="password" placeholder="Noch nicht konfiguriert" />
            </div>
          </div>
        </div>

        {/* Footer: Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => window.location.reload()}>Abbrechen</Button>
          <Button 
            className="bg-slate-900 text-white hover:bg-slate-800" 
            onClick={handleSave}
          >
            Einstellungen speichern
          </Button>
        </div>
      </div>
    </div>
  );
}
