import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, Users, DollarSign } from 'lucide-react';
import axios from 'axios';
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Reports() {
  const [stats, setStats] = useState({
    total_rooms: 0,
    occupied_rooms: 0,
    month_bookings: 0,
    month_revenue: 0,
    occupancy_rate: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/statistics/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Mock data for charts
  const occupancyData = [
    { name: 'Jan', auslastung: 65 },
    { name: 'Feb', auslastung: 72 },
    { name: 'Mär', auslastung: 78 },
    { name: 'Apr', auslastung: 85 },
    { name: 'Mai', auslastung: 92 },
    { name: 'Jun', auslastung: 88 },
  ];

  const revenueData = [
    { name: 'Jan', umsatz: 12500 },
    { name: 'Feb', umsatz: 15800 },
    { name: 'Mär', umsatz: 18200 },
    { name: 'Apr', umsatz: 21500 },
    { name: 'Mai', umsatz: 24800 },
    { name: 'Jun', umsatz: 22300 },
  ];

  return (
    <div className="p-8" data-testid="reports-page">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900" data-testid="reports-title">Berichte & Statistiken</h1>
        <p className="text-stone-600 mt-2">Analysieren Sie Ihre Hotelleistung</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6" data-testid="metric-occupancy">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-stone-500 font-medium">Auslastung</span>
          </div>
          <p className="text-4xl font-bold mono text-slate-900">{stats.occupancy_rate}%</p>
          <p className="text-xs text-emerald-600 mt-2">Aktueller Monat</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6" data-testid="metric-bookings">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-stone-500 font-medium">Buchungen</span>
          </div>
          <p className="text-4xl font-bold mono text-slate-900">{stats.month_bookings}</p>
          <p className="text-xs text-blue-600 mt-2">Diesen Monat</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6" data-testid="metric-revenue">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-stone-500 font-medium">Umsatz</span>
          </div>
          <p className="text-4xl font-bold mono text-slate-900">€{stats.month_revenue.toFixed(0)}</p>
          <p className="text-xs text-emerald-600 mt-2">Diesen Monat</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6" data-testid="metric-rooms">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 rounded-lg">
              <BarChart className="w-5 h-5 text-slate-600" />
            </div>
            <span className="text-stone-500 font-medium">Zimmer Gesamt</span>
          </div>
          <p className="text-4xl font-bold mono text-slate-900">{stats.total_rooms}</p>
          <p className="text-xs text-stone-600 mt-2">{stats.occupied_rooms} belegt</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Chart */}
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6" data-testid="occupancy-chart">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Auslastungstrend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={occupancyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="name" stroke="#78716c" />
              <YAxis stroke="#78716c" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="auslastung" stroke="#059669" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6" data-testid="revenue-chart">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Umsatzentwicklung</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBar data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="name" stroke="#78716c" />
              <YAxis stroke="#78716c" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="umsatz" fill="#0f172a" />
            </RechartsBar>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
