import React, { useState } from 'react';
import { Hotel, Mail, Globe, Bell, Shield } from 'lucide-react';
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
    senderEmail: 'onboarding@resend.dev'
  });

  const handleSave = () => {
    toast.success('Einstellungen gespeichert');
  };

  return (
    <div className="p-8" data-testid="settings-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900" data-testid="settings-title">Einstellungen</h1>
        <p className="text-stone-600 mt-2">Konfigurieren Sie Ihr Hotelmanagementsystem</p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Hotel Information */}
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6" data-testid="hotel-info-section">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-900 rounded-lg">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Hotelinformationen</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Hotelname</Label>
              <Input
                value={settings.hotelName}
                onChange={(e) => setSettings({...settings, hotelName: e.target.value})}
                data-testid="input-hotel-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>E-Mail</Label>
                <Input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({...settings, email: e.target.value})}
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input
                  value={settings.phone}
                  onChange={(e) => setSettings({...settings, phone: e.target.value})}
                  data-testid="input-phone"
                />
              </div>
            </div>
            <div>
              <Label>Adresse</Label>
              <Input
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                data-testid="input-address"
              />
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6" data-testid="regional-settings">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Regionale Einstellungen</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Währung</Label>
              <Input
                value={settings.currency}
                onChange={(e) => setSettings({...settings, currency: e.target.value})}
                data-testid="input-currency"
              />
            </div>
            <div>
              <Label>Zeitzone</Label>
              <Input
                value={settings.timezone}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                data-testid="input-timezone"
              />
            </div>
          </div>
        </div>

        {/* Email Configuration */}
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6" data-testid="email-config">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">E-Mail-Konfiguration</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Resend API Key</Label>
              <Input
                type="password"
                placeholder="re_xxxxxxxxxxxxx"
                value={settings.resendApiKey}
                onChange={(e) => setSettings({...settings, resendApiKey: e.target.value})}
                data-testid="input-resend-key"
              />
              <p className="text-xs text-stone-500 mt-1">Holen Sie sich Ihren API-Schlüssel von resend.com</p>
            </div>
            <div>
              <Label>Absender-E-Mail</Label>
              <Input
                type="email"
                value={settings.senderEmail}
                onChange={(e) => setSettings({...settings, senderEmail: e.target.value})}
                data-testid="input-sender-email"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6" data-testid="notifications-section">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500 rounded-lg">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Benachrichtigungen</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">E-Mail-Benachrichtigungen</p>
                <p className="text-sm text-stone-600">Empfangen Sie Updates per E-Mail</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                data-testid="switch-email-notifications"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Buchungsbenachrichtigungen</p>
                <p className="text-sm text-stone-600">Sofortige Benachrichtigungen bei neuen Buchungen</p>
              </div>
              <Switch
                checked={settings.bookingAlerts}
                onCheckedChange={(checked) => setSettings({...settings, bookingAlerts: checked})}
                data-testid="switch-booking-alerts"
              />
            </div>
          </div>
        </div>

        {/* Booking.com Integration */}
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6" data-testid="booking-com-section">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-600 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Booking.com Integration</h2>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800">
              <strong>Hinweis:</strong> Die Booking.com Integration ist vorbereitet, aber benötigt einen API-Schlüssel von Booking.com.
              Kontaktieren Sie Booking.com für den Zugang zur Connectivity API.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Booking.com Client ID</Label>
              <Input
                placeholder="Noch nicht konfiguriert"
                disabled
                data-testid="input-booking-client-id"
              />
            </div>
            <div>
              <Label>Booking.com Client Secret</Label>
              <Input
                type="password"
                placeholder="Noch nicht konfiguriert"
                disabled
                data-testid="input-booking-secret"
              />
            </div>
            <p className="text-xs text-stone-500">
              Die Integration ermöglicht automatische Synchronisierung von Verfügbarkeit, Preisen und Buchungen.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => toast.info('Abgebrochen')}>Abbrechen</Button>
          <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleSave} data-testid="save-settings-btn">
            Einstellungen speichern
          </Button>
        </div>
      </div>
    </div>
  );
}
