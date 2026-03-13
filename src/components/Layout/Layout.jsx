import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Hotel, 
  FileText, 
  BarChart3, 
  Settings,
  Menu,
  X
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/bookings', icon: Calendar, label: 'Buchungen' },
    { path: '/guests', icon: Users, label: 'Gäste' },
    { path: '/rooms', icon: Hotel, label: 'Zimmer' },
    { path: '/ferienhaus', icon: Hotel, label: 'Ferienhaus' }, // Neu hinzugefügt
    { path: '/invoices', icon: FileText, label: 'Rechnungen' },
    { path: '/reports', icon: BarChart3, label: 'Berichte' },
    { path: '/settings', icon: Settings, label: 'Einstellungen' },
  ];

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* MOBILE HEADER (Nur auf Handy sichtbar) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-stone-200 z-50 flex items-center justify-between px-4">
        <span className="font-bold text-slate-900 text-xl tracking-tight">HotelPro</span>
        <button 
          onClick={toggleMenu}
          className="p-2 text-slate-600 hover:bg-stone-100 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* SIDEBAR (Desktop: Fest | Handy: Overlay) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="hidden lg:block mb-10">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HotelPro</h1>
            <p className="text-stone-400 text-xs mt-1 uppercase tracking-widest font-semibold">Management v1.0</p>
          </div>

          <nav className="flex-1 space-y-1 mt-12 lg:mt-0">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)} // Schließt Menü nach Klick auf Handy
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-200' 
                      : 'text-stone-500 hover:bg-stone-100 hover:text-slate-900'}
                  `}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-stone-100">
            <p className="text-[10px] text-stone-400 text-center">Angemeldet als Admin</p>
          </div>
        </div>
      </aside>

      {/* OVERLAY (Dunkler Hintergrund wenn Handy-Menü offen) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={toggleMenu}
        />
      )}

      {/* MAIN CONTENT Area */}
      <main className="flex-1 flex flex-col min-w-0 pt-16 lg:pt-0">
        <div className="flex-1 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
