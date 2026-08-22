import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_HOME } from './navConfig.js';

function Logo({ dark = false }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${dark ? 'text-white' : 'text-foreground'}`} aria-label="SmartCare home">
      <img src="/logo-mark.svg" alt="SmartCare" className="h-9 w-9" />
      <span className="display text-[1.35rem] font-bold tracking-tight">smartcare</span>
    </Link>
  );
}

export default function PublicLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = [
    { to: '/', label: 'Home', end: true },
    { to: '/services', label: 'Services' },
    { to: '/how-it-works', label: 'How it works' },
    { to: '/find-caregivers', label: 'Caregivers' },
    { to: '/locations', label: 'Locations' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="absolute left-0 right-0 top-0 z-30">
        <div className="page-shell flex h-20 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-semibold text-foreground/75 md:flex">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `transition hover:text-primary ${isActive ? 'text-primary' : ''}`}>
                {link.label}
              </NavLink>
            ))}
            {user ? (
              <button onClick={() => navigate(ROLE_HOME[user.role])} className="rounded-full bg-primary px-5 py-2.5 text-primary-foreground transition hover:-translate-y-0.5">
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="transition hover:text-primary">Sign in</Link>
                <Link to="/register" className="rounded-full bg-primary px-5 py-2.5 text-primary-foreground transition hover:-translate-y-0.5">Create an account</Link>
              </>
            )}
          </nav>
          <button onClick={() => setOpen(!open)} className="rounded-lg p-2 md:hidden" aria-label="Open menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {open && (
          <div className="mx-5 rounded-2xl border border-border bg-card p-3 shadow-soft md:hidden">
            {links.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold hover:bg-muted">
                {link.label}
              </Link>
            ))}
            {user ? (
              <button onClick={() => { setOpen(false); navigate(ROLE_HOME[user.role]); }} className="mt-1 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Dashboard</button>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold hover:bg-muted">Sign in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="block rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground">Create an account</Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 pt-20"><Outlet /></main>

      <footer className="border-t border-border bg-muted/40">
        <div className="page-shell py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <Logo />
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Helping families in Nepal find trusted, verified caregivers for home and hospital care since 2024.
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground/60">Quick links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                 <li><Link to="/services" className="link-muted">Our services</Link></li>
                 <li><Link to="/find-caregivers" className="link-muted">Find a caregiver</Link></li>
                <li><Link to="/how-it-works" className="link-muted">How it works</Link></li>
                 <li><Link to="/locations" className="link-muted">Locations</Link></li>
                 <li><Link to="/about" className="link-muted">About SmartCare</Link></li>
                 <li><Link to="/contact" className="link-muted">Contact us</Link></li>
                <li><Link to="/login" className="link-muted">Sign in</Link></li>
                <li><Link to="/register" className="link-muted">Create account</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground/60">Contact us</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>info@smartcare.com.np</li>
                <li>+977-1-4567890</li>
                <li>Baneshwor, Kathmandu<br />Nepal 44600</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground/60">For caregivers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/register" className="link-muted">Join as a caregiver</Link></li>
                <li><Link to="/how-it-works" className="link-muted">Verification process</Link></li>
                <li><Link to="/find-caregivers" className="link-muted">Browse caregivers</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
            <span>&copy; {new Date().getFullYear()} SmartCare Nepal. All rights reserved.</span>
            <span>Made in Kathmandu for families across Nepal.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
