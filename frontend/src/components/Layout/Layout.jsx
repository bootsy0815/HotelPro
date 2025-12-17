import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Hotel, FileText, BarChart3, Settings } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Buchungen', path: '/bookings', icon: Calendar },
    { name: 'Gäste', path: '/guests', icon: Users },
    { name: 'Zimmer', path: '/rooms', icon: Hotel },
    { name: 'Rechnungen', path: '/invoices', icon: FileText },
    { name: 'Berichte', path: '/reports', icon: BarChart3 },
    { name: 'Einstellungen', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col" data-testid="sidebar">
        <div className="p-6 border-b border-stone-200">
          <h1 className="text-2xl font-bold text-slate-900" data-testid="app-title">HotelPro</h1>
          <p className="text-sm text-stone-500 mt-1">Management System</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1" data-testid="navigation-menu">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-link-${item.name.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-stone-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-stone-200">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium mb-1">
              <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
              System Online
            </div>
            <p className="text-xs text-emerald-600">Alle Systeme betriebsbereit</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" data-testid="main-content">
        <Outlet />
      </main>
    </div>
  );
}
