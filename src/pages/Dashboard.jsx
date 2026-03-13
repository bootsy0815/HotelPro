import React, { useState, useEffect } from 'react';
import { 
  Home, Users, Calendar, DollarSign, TrendingUp, 
  CheckCircle, Clock, Plus, TreePine, LogOut 
} from 'lucide-react'; // KORRIGIERT: lucide-react statt lucide-center
import { Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = `${window.location.protocol}//${window.location.hostname}:8001`;
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
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hotel_auth');
    window.location.reload();
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs md:text-sm text-stone-500 font-medium uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
            {loading ? <span className="animate-pulse">...</span> : value}
          </h3>
        </div>
        <div className={`p-2 md:p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-stone-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-stone-600 text-sm md:text-base mt-1 italic">Hotel & Ferienhaus Management</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Link to="/bookings" className="flex-1 md:flex-none bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Neue Reservierung
          </Link>
          <button onClick={handleLogout} className="flex-1 md:flex-none bg-white border border-stone-200 text-stone-600 px-4 py-2 rounded-lg flex items-center justify-center hover:bg-stone-100 transition-colors text-sm font-medium shadow-sm">
            <LogOut className="w-4 h-4 mr-2" /> Abmelden
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <StatCard title="Objekte gesamt" value={stats.total_rooms} icon={Home} color="bg-slate-900" />
            <StatCard title="Verfügbar" value={stats.available_rooms} icon={CheckCircle} color="bg-emerald-600" />
            <StatCard title="Check-ins heute" value={stats.todays_checkins} icon={Users} color="bg-blue-600" />
            <StatCard title="Umsatz" value={`€${stats.month_revenue?.toLocaleString()}`} icon={DollarSign} color="bg-amber-500" />
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 tracking-tight">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              <Link to="/bookings" className="p-4 bg-blue-600 text-white rounded-lg flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-2 shadow-sm hover:opacity-90 transition-opacity">
                <Calendar className="w-6 h-6 shrink-0" />
                <p className="font-bold text-sm">Buchungen</p>
              </Link>
              <Link to="/guests" className="p-4 bg-emerald-600 text-white rounded-lg flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-2 shadow-sm hover:opacity-90 transition-opacity">
                <Users className="w-6 h-6 shrink-0" />
                <p className="font-bold text-sm">Gäste</p>
              </Link>
              <Link to="/rooms" className="p-4 bg-amber-500 text-white rounded-lg flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-2 shadow-sm hover:opacity-90 transition-opacity">
                <Home className="w-6 h-6 shrink-0" />
                <p className="font-bold text-sm">Zimmer</p>
              </Link>
              <Link to="/ferienhaus" className="p-4 bg-slate-900 text-white rounded-lg flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-2 shadow-sm hover:opacity-90 transition-opacity">
                <TreePine className="w-6 h-6 shrink-0 text-emerald-400" />
                <p className="font-bold text-sm">Ferienhaus</p>
              </Link>
              <Link to="/reports" className="p-4 bg-rose-600 text-white rounded-lg flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-2 shadow-sm hover:opacity-90 transition-opacity">
                <TrendingUp className="w-6 h-6 shrink-0" />
                <p className="font-bold text-sm">Berichte</p>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Aktivitäten</h2>
            <Clock className="w-5 h-5 text-stone-400" />
          </div>
          <div className="space-y-6">
            <ActivityItem time="09:15" title="Check-in: Gast" desc="Objekt 104" type="checkin" />
            <ActivityItem time="11:30" title="Reinigung" desc="Ferienhaus fertig" type="cleaning" />
            <ActivityItem time="14:45" title="Reservierung" desc="Online-Buchung" type="booking" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ time, title, desc, type }) {
  // KORRIGIERT: String vollständig geschlossen
  const colors = { 
    checkin: "bg-blue-500", 
    checkout: "bg-amber-500", 
    cleaning: "bg-emerald-500", 
    booking: "bg-slate-900" 
  };
  
  return (
    <div className="flex gap-4 relative">
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-3 h-3 rounded-full ${colors[type] || 'bg-stone-300'} z-10`} />
        <div className="w-0.5 h-full bg-stone-100 absolute top-3" />
      </div>
      <div className="pb-2">
        <p className="text-[10px] font-bold text-stone-400 uppercase leading-none">{time}</p>
        <p className="text-sm font-bold text-slate-900 mt-1">{title}</p>
        <p className="text-xs text-stone-500">{desc}</p>
      </div>
    </div>
  );
}
