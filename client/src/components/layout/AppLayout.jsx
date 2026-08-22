import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo, { LogoMark } from '../Logo.jsx';
import Avatar from '../Avatar.jsx';
import NotificationBell from '../NotificationBell.jsx';
import { NAV, ROLE_LABEL } from './navConfig.js';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = NAV[user.role] || [];
  const bottomItems = items.filter((i) => i.primary).slice(0, 5);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
      isActive ? 'bg-brand-50 text-brand-800 border-l-2 border-brand-600' : 'text-ink-soft hover:bg-brand-50/60'
    }`;

  return (
    <div className="min-h-screen bg-surface-warm">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="flex h-16 items-center px-6">
          <Link to="/"><Logo size={30} textClass="text-xl" /></Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scroll-none">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className={linkClass}>
              <it.icon size={19} />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200/80 p-3">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-brand-50/60">
            <LogOut size={19} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-6">
          <Link to="/" className="lg:hidden"><LogoMark size={30} /></Link>
          <div className="hidden lg:block">
            <span className="text-sm text-ink-muted">Signed in as </span>
            <span className="text-sm font-semibold text-ink">{ROLE_LABEL[user.role]}</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-brand-50/60"
              >
                <Avatar name={user.name} size="sm" />
                <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-ink sm:block">{user.name}</span>
                <ChevronDown size={16} className="text-ink-muted" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 animate-fade-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lift">
                  <div className="border-b border-slate-200/80 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                    <p className="truncate text-xs text-ink-muted">{user.email}</p>
                  </div>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-danger hover:bg-brand-50/60">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Routed page */}
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200/80 bg-white/95 backdrop-blur lg:hidden">
        {bottomItems.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                isActive ? 'text-brand-600' : 'text-ink-muted'
              }`
            }
          >
            <it.icon size={22} />
            <span className="truncate px-1">{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
