import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Guests from './pages/Guests';
import Rooms from './pages/Rooms';
import Ferienhaus from './pages/Ferienhaus'; // Import war schon da, sehr gut!
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import '@/App.css';
import { Toaster } from 'sonner';

function App() {
  // Prüfen, ob der User bereits eingeloggt ist
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('hotel_auth') === 'true'
  );
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'HotelPro2024!') {
      localStorage.setItem('hotel_auth', 'true');
      setIsAuthenticated(true);
    } else {
      alert('Falsches Passwort!');
    }
  };

  // 1. LOGIN-BILDSCHIRM
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-stone-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">HotelPro</h1>
            <p className="text-stone-500 mt-2">Bitte anmelden</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Passwort</label>
              <input
                type="password"
                placeholder="Passwort eingeben"
                className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white p-3 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-sm"
            >
              Anmelden
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. HAUPT-ANWENDUNG
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="guests" element={<Guests />} />
            <Route path="rooms" element={<Rooms />} />
            {/* HIER IST DIE NEUE ROUTE FÜR DAS FERIENHAUS */}
            <Route path="ferienhaus" element={<Ferienhaus />} /> 
            <Route path="invoices" element={<Invoices />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
