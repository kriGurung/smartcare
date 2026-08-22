import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Search,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Clock,
  Heart,
} from 'lucide-react';

/* ── Location data sourced from SmartCare seed (server/src/utils/seed.js) ── */
const locations = [
  {
    city: 'Kathmandu',
    region: 'valley',
    province: 'Bagmati',
    image: '/images/locations/kathmandu.svg',
    services: ['Elderly Care', 'Medication Management', 'Palliative Care', 'Maternity & Newborn'],
    caregivers: 3,
    description: 'Capital city with the largest network of verified caregivers.',
  },
  {
    city: 'Lalitpur',
    region: 'valley',
    province: 'Bagmati',
    image: '/images/locations/lalitpur.svg',
    services: ['Hospital Sitter', 'Post-Surgery Care', 'Palliative Care'],
    caregivers: 1,
    description: 'Hospital sitter and post-surgery recovery support.',
  },
  {
    city: 'Bhaktapur',
    region: 'valley',
    province: 'Bagmati',
    image: '/images/locations/bhaktapur.svg',
    services: ['Physiotherapy Assist', 'Disability Support'],
    caregivers: 1,
    description: 'Community-rooted home care and disability support.',
  },
  {
    city: 'Pokhara',
    region: 'western',
    province: 'Gandaki',
    image: '/images/locations/pokhara.svg',
    services: ['Disability Support', 'Elderly Care'],
    caregivers: 1,
    description: 'Western Nepal care services hub.',
  },
];

const regions = [
  { key: 'all', label: 'All' },
  { key: 'valley', label: 'Kathmandu Valley' },
  { key: 'western', label: 'Western Nepal' },
];

/* ── Location Card ──────────────────────────────────────────────────────── */

function LocationCard({ loc }) {
  return (
    <Link
      to={`/find-caregivers?city=${encodeURIComponent(loc.city)}`}
      className="group card-base flex flex-col overflow-hidden transition duration-200 hover:shadow-lift"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-sunken">
        <img
          src={loc.image}
          alt={`${loc.city} — SmartCare care services location`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Gradient overlay at bottom of image */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary shadow-sm backdrop-blur-sm">
          <MapPin size={11} />
          {loc.province}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="display text-lg font-bold">{loc.city}</h3>

        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {loc.description}
        </p>

        <div className="mt-auto pt-4">
          {/* Service status */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-care-600">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-care-50">
              <Heart size={11} className="text-care-500" />
            </span>
            {loc.services.length} services available
          </div>

          {/* Caregiver count */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck size={12} className="text-primary" />
            {loc.caregivers} verified caregiver{loc.caregivers !== 1 ? 's' : ''}
          </div>

          {/* Browse link */}
          <div className="mt-3 flex items-center gap-1 text-sm font-bold text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Browse caregivers
            <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Locations() {
  const [query, setQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState('all');

  const filtered = useMemo(() => {
    let result = locations;
    if (activeRegion !== 'all') {
      result = result.filter((l) => l.region === activeRegion);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.city.toLowerCase().includes(q) ||
          l.province.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.services.some((s) => s.toLowerCase().includes(q))
      );
    }
    return result;
  }, [query, activeRegion]);

  const totalCount = locations.length;
  const totalCaregivers = locations.reduce((sum, l) => sum + l.caregivers, 0);

  return (
    <div className="min-h-dvh">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="bg-brand-50 pt-12 pb-16 sm:pt-16 sm:pb-24">
        <div className="page-shell">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Link to="/" className="transition hover:text-primary">Home</Link>
            <ChevronRight size={13} />
            <span className="text-foreground">Locations</span>
          </nav>

          <h1 className="display mt-6 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            Healthcare &amp; Care Services Across Nepal
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            SmartCare connects families with verified, background-checked caregivers
            for home and hospital care. Find trusted professionals in your city.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/find-caregivers"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              Find a Caregiver <ArrowRight size={16} />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-card px-6 py-3 text-sm font-bold text-foreground transition hover:bg-card/80"
            >
              How It Works
            </Link>
          </div>

          {/* Trust stats */}
          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <ShieldCheck className="text-primary" size={18} />
              {totalCaregivers} verified caregivers
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="text-primary" size={18} />
              {totalCount} cities served
            </span>
            <span className="flex items-center gap-2">
              <Clock className="text-primary" size={18} />
              Home &amp; hospital care
            </span>
          </div>
        </div>
      </section>

      {/* ── Search + Filters ────────────────────────────────────────────── */}
      <section className="page-shell relative z-10 -mt-6 pb-10 sm:-mt-8 sm:pb-14">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search locations..."
                className="input-base pl-11"
              />
            </div>

            {/* Region tabs */}
            <div className="flex gap-1 overflow-x-auto scroll-none rounded-xl bg-muted p-1">
              {regions.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setActiveRegion(r.key)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition ${
                    activeRegion === r.key
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Location Grid ───────────────────────────────────────────────── */}
      <section className="page-shell section-space">
        {/* Heading + count */}
        <div className="mb-8 flex items-end justify-between">
          <h2 className="display text-2xl font-bold sm:text-3xl">
            SmartCare Locations
          </h2>
          <span className="text-sm font-semibold text-muted-foreground">
            {filtered.length} of {totalCount} locations
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-20 text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-surface-sunken text-ink-faint">
              <MapPin size={26} />
            </span>
            <h3 className="text-base font-semibold text-ink">Location not found</h3>
            <p className="mt-1 max-w-sm text-sm text-ink-muted">
              We do not have verified caregivers in this area yet. We are actively
              expanding — check back soon or request your city.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  setQuery('');
                  setActiveRegion('all');
                }}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
              >
                View all locations
              </button>
              <Link
                to="/register?role=caregiver"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-bold text-foreground transition hover:bg-muted"
              >
                Join as a caregiver
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((loc) => (
              <LocationCard key={loc.city} loc={loc} />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA Section ─────────────────────────────────────────────────── */}
      <section className="bg-brand-50 py-16 sm:py-20">
        <div className="page-shell text-center">
          <h2 className="display text-2xl font-bold sm:text-3xl">
            Do not see your city?
          </h2>
          <p className="mt-3 mx-auto max-w-lg text-muted-foreground">
            We are actively expanding our network of verified caregivers.
            Tell us where you need care and we will prioritize your area.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/register?role=caregiver"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              Join as a caregiver <ArrowRight size={15} />
            </Link>
            <Link
              to="/find-caregivers"
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-card px-6 py-3 text-sm font-bold text-foreground transition hover:bg-card/80"
            >
              Browse available cities
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
