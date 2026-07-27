import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ShieldCheck, Eye, Lock, ArrowRight, Star, HeartHandshake,
  UserCheck, CalendarCheck, CreditCard, Stethoscope,
} from 'lucide-react';
import api from '../../services/api.js';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_HOME } from '../../components/layout/navConfig.js';

const TRUST = [
  { icon: ShieldCheck, title: 'Every caregiver verified', body: 'Citizenship, training certificates and police clearance are checked before anyone appears in search.' },
  { icon: Eye, title: 'Every booking transparent', body: 'See ratings, verification checklists and clear hourly pricing up front — no surprises.' },
  { icon: Lock, title: 'Every payment secure', body: 'Pay safely with eSewa, Khalti, bank transfer or cash. Money is handled transparently.' },
];

const STEPS = [
  { icon: Search, title: 'Search', body: 'Browse verified caregivers by service, location and rating.' },
  { icon: UserCheck, title: 'Choose', body: 'Review profiles, experience and genuine patient reviews.' },
  { icon: CalendarCheck, title: 'Book', body: 'Pick a time and place — home or hospital — in a few taps.' },
  { icon: CreditCard, title: 'Pay & relax', body: 'Pay securely and track the visit with digital care logs.' },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [banner, setBanner] = useState('');
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.get('/meta/public').then((r) => setBanner(r.data.banner || '')).catch(() => {});
    api.get('/services').then((r) => setServices(r.data.services || [])).catch(() => {});
  }, []);

  function search(e) {
    e.preventDefault();
    navigate(`/find-caregivers${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  }

  return (
    <div>
      {banner && (
        <div className="bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white">{banner}</div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-semibold text-brand-700 shadow-sm ring-1 ring-brand-600/10">
                <HeartHandshake size={15} /> Trusted home & hospital care
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                Verified caregivers, <span className="text-brand-600">on demand</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-ink-soft">
                SmartCare connects families with background-checked caregivers for elderly care, post-surgery
                recovery, hospital support and more — across Nepal.
              </p>

              <form onSubmit={search} className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by name or city…"
                    className="input-base pl-11"
                  />
                </div>
                <Button type="submit" size="lg" icon={Search}>Find care</Button>
              </form>

              <div className="mt-6 flex items-center gap-6 text-sm text-ink-muted">
                <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-care-500" /> Verified profiles</span>
                <span className="flex items-center gap-1.5"><Star size={16} className="text-amber-400" /> Real reviews</span>
              </div>
            </div>

            {/* Illustrative trust card */}
            <div className="relative hidden lg:block">
              <div className="card-base rotate-2 p-6 shadow-lift">
                <div className="flex items-center gap-4">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">SR</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-lg font-semibold text-ink">Sita Rai</h3>
                      <ShieldCheck size={18} className="text-brand-600" />
                    </div>
                    <p className="text-sm text-ink-muted">Elderly Care · Kathmandu</p>
                    <div className="mt-1 flex items-center gap-1">
                      {[1,2,3,4,5].map((i) => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}
                      <span className="ml-1 text-sm font-semibold">4.9</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-5">
                  {['Citizenship / National ID', 'Training Certificate', 'Police Clearance'].map((c) => (
                    <div key={c} className="flex items-center gap-2 text-sm text-ink-soft">
                      <ShieldCheck size={16} className="text-care-500" /> {c}
                    </div>
                  ))}
                </div>
              </div>
              <div className="card-base absolute -bottom-6 -left-6 -rotate-3 p-4 shadow-lift">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-care-50 text-care-600"><CreditCard size={20} /></span>
                  <div>
                    <p className="text-xs text-ink-muted">Payment secured</p>
                    <p className="text-sm font-bold text-ink">Rs. 1,200</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust pillars */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.title} className="card-base p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><t.icon size={24} /></span>
              <h3 className="mt-4 text-lg font-semibold text-ink">{t.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section className="bg-surface-muted">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-ink">Care for every need</h2>
              <p className="mt-2 text-ink-muted">From daily assistance to specialised recovery support.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {services.map((s) => (
                <Link
                  key={s.id}
                  to={`/find-caregivers?service=${s.id}`}
                  className="card-base group flex flex-col gap-2 p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-care-50 text-care-600 transition group-hover:bg-care-500 group-hover:text-white">
                    <Stethoscope size={20} />
                  </span>
                  <h3 className="mt-1 font-semibold text-ink">{s.name}</h3>
                  <p className="line-clamp-2 text-sm text-ink-muted">{s.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink">How SmartCare works</h2>
          <p className="mt-2 text-ink-muted">Four simple steps to trusted care.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-white shadow-lift">
                <s.icon size={28} />
              </div>
              <div className="absolute left-1/2 top-0 -translate-x-16 text-sm font-bold text-brand-200">{i + 1}</div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button as={Link} to="/how-it-works" variant="outline" icon={ArrowRight}>Learn more</Button>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-gradient-to-r from-brand-600 to-care-500">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-14 text-center sm:px-6 md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to find trusted care?</h2>
            <p className="mt-2 text-white/90">Join families across Nepal — or start earning as a verified caregiver.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {user ? (
              <Button size="lg" variant="outline" onClick={() => navigate(ROLE_HOME[user.role])}>Go to dashboard</Button>
            ) : (
              <>
                <Button as={Link} to="/find-caregivers" size="lg" className="bg-white text-brand-700 hover:bg-brand-50">Find a caregiver</Button>
                <Button as={Link} to="/register" size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">Become a caregiver</Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
