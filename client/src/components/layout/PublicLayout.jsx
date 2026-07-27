import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from '../Logo.jsx';
import Button from '../ui/Button.jsx';
import { ROLE_HOME } from './navConfig.js';

export default function PublicLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/find-caregivers', label: 'Find caregivers' },
    { to: '/how-it-works', label: 'How it works' },
  ];
  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition ${isActive ? 'text-brand-600' : 'text-ink-soft hover:text-brand-600'}`;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/"><Logo size={30} textClass="text-xl" /></Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <Button size="sm" onClick={() => navigate(ROLE_HOME[user.role])}>Go to dashboard</Button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-ink-soft hover:text-brand-600">Log in</Link>
                <Button size="sm" as={Link} to="/register">Get started</Button>
              </>
            )}
          </div>

          <button className="rounded-lg p-2 text-ink-soft md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="py-1 text-sm font-medium text-ink-soft">
                  {l.label}
                </NavLink>
              ))}
              <hr className="border-slate-100" />
              {user ? (
                <Button size="sm" onClick={() => { setOpen(false); navigate(ROLE_HOME[user.role]); }}>Go to dashboard</Button>
              ) : (
                <div className="flex gap-3">
                  <Button size="sm" variant="outline" as={Link} to="/login" className="flex-1" onClick={() => setOpen(false)}>Log in</Button>
                  <Button size="sm" as={Link} to="/register" className="flex-1" onClick={() => setOpen(false)}>Get started</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="border-t border-slate-100 bg-surface-muted">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <Logo size={28} textClass="text-lg" />
              <p className="mt-2 max-w-sm text-sm text-ink-muted">
                Every caregiver verified. Every booking transparent. Every payment secure.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <Link to="/find-caregivers" className="link-muted">Find caregivers</Link>
              <Link to="/how-it-works" className="link-muted">How it works</Link>
              <Link to="/register" className="link-muted">Become a caregiver</Link>
              <Link to="/login" className="link-muted">Log in</Link>
            </div>
          </div>
          <p className="mt-8 text-xs text-ink-faint">© {new Date().getFullYear()} SmartCare. Built for families across Nepal.</p>
        </div>
      </footer>
    </div>
  );
}
