import React, { useState, useEffect } from 'react';
import { Home, Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_rooms: 0,
    available_rooms: 0,
    occupied_rooms: 0,
    todays_checkins: 0,
    todays_checkouts: 0,
    month_bookings: 0,
    month_revenue: 0,
    occupancy_rate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API}/statistics/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, testId }) => (
    <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow" data-testid={testId}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-stone-500 font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2 mono">{value}</h3>
          {subtitle && <p className="text-xs text-stone-600 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-stone-600">Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900" data-testid="dashboard-title">Übersicht</h1>
        <p className="text-stone-600 mt-2">Willkommen zurück! Hier ist Ihre heutige Übersicht.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Gesamtzimmer"
          value={stats.total_rooms}
          icon={Home}
          color="bg-slate-900"
          testId="stat-total-rooms"
        />
        <StatCard
          title="Verfügbare Zimmer"
          value={stats.available_rooms}
          icon={Home}
          color="bg-emerald-600"
          testId="stat-available-rooms"
        />
        <StatCard
          title="Belegte Zimmer"
          value={stats.occupied_rooms}
          icon={Users}
          color="bg-rose-600"
          subtitle={`Auslastung: ${stats.occupancy_rate}%`}
          testId="stat-occupied-rooms"
        />
        <StatCard
          title="Monatsumsatz"
          value={`€${stats.month_revenue.toFixed(2)}`}
          icon={DollarSign}
          color="bg-emerald-600"
          subtitle={`${stats.month_bookings} Buchungen`}
          testId="stat-month-revenue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Activity */}
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6" data-testid="todays-activity">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Heutige Aktivitäten</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Check-ins heute</p>
                  <p className="text-sm text-stone-600">Ankommende Gäste</p>
                </div>
              </div>
              <span className="text-2xl font-bold mono text-slate-900" data-testid="todays-checkins">{stats.todays_checkins}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Check-outs heute</p>
                  <p className="text-sm text-stone-600">Abreisende Gäste</p>
                </div>
              </div>
              <span className="text-2xl font-bold mono text-slate-900" data-testid="todays-checkouts">{stats.todays_checkouts}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6" data-testid="quick-actions">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Schnellaktionen</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              className="p-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-left"
              data-testid="quick-action-new-booking"
            >
              <Calendar className="w-6 h-6 mb-2" />
              <p className="font-medium">Neue Buchung</p>
              <p className="text-xs opacity-80 mt-1">Buchung erstellen</p>
            </button>
            <button 
              className="p-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-left"
              data-testid="quick-action-new-guest"
            >
              <Users className="w-6 h-6 mb-2" />
              <p className="font-medium">Neuer Gast</p>
              <p className="text-xs opacity-80 mt-1">Gast hinzufügen</p>
            </button>
            <button 
              className="p-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-left"
              data-testid="quick-action-room-status"
            >
              <Home className="w-6 h-6 mb-2" />
              <p className="font-medium">Zimmerstatus</p>
              <p className="text-xs opacity-80 mt-1">Status ändern</p>
            </button>
            <button 
              className="p-4 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-left"
              data-testid="quick-action-reports"
            >
              <TrendingUp className="w-6 h-6 mb-2" />
              <p className="font-medium">Berichte</p>
              <p className="text-xs opacity-80 mt-1">Statistiken ansehen</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
