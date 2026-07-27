import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Home, Building2, X, Users } from 'lucide-react';
import api from '../../services/api.js';
import CaregiverCard from '../../components/CaregiverCard.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Select } from '../../components/ui/Field.jsx';
import Button from '../../components/ui/Button.jsx';

export default function FindCaregiver() {
  const [params, setParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [qInput, setQInput] = useState(params.get('q') || '');

  const service = params.get('service') || '';
  const location = params.get('location') || '';
  const city = params.get('city') || '';
  const minRating = params.get('minRating') || '';
  const sort = params.get('sort') || '';

  useEffect(() => {
    api.get('/services').then((r) => setServices(r.data.services || [])).catch(() => {});
  }, []);

  const fetchCaregivers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/caregivers', {
        params: {
          q: params.get('q') || undefined,
          service: service || undefined,
          location: location || undefined,
          city: city || undefined,
          minRating: minRating || undefined,
          sort: sort || undefined,
        },
      });
      setCaregivers(res.data.caregivers || []);
    } catch {
      setCaregivers([]);
    } finally {
      setLoading(false);
    }
  }, [params, service, location, city, minRating, sort]);

  useEffect(() => { fetchCaregivers(); }, [fetchCaregivers]);

  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  function submitSearch(e) {
    e.preventDefault();
    update('q', qInput.trim());
  }

  function clearAll() {
    setQInput('');
    setParams(new URLSearchParams(), { replace: true });
  }

  const activeFilters = [service, location, city, minRating].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Find a caregiver</h1>
        <p className="mt-1 text-ink-muted">Browse verified, background-checked caregivers near you.</p>
      </div>

      {/* Search + filter toggle */}
      <form onSubmit={submitSearch} className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Search by name…" className="input-base pl-11" />
        </div>
        <Button type="submit" icon={Search}>Search</Button>
        <Button type="button" variant="outline" icon={SlidersHorizontal} onClick={() => setShowFilters((s) => !s)}>
          Filters{activeFilters > 0 && <span className="ml-1 rounded-full bg-brand-600 px-1.5 text-xs text-white">{activeFilters}</span>}
        </Button>
      </form>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-6 card-base animate-fade-in p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select label="Service" value={service} onChange={(e) => update('service', e.target.value)}>
              <option value="">All services</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Select label="Care location" value={location} onChange={(e) => update('location', e.target.value)}>
              <option value="">Anywhere</option>
              <option value="home">Home visits</option>
              <option value="hospital">Hospital care</option>
            </Select>
            <Select label="Minimum rating" value={minRating} onChange={(e) => update('minRating', e.target.value)}>
              <option value="">Any rating</option>
              <option value="4">4+ stars</option>
              <option value="4.5">4.5+ stars</option>
            </Select>
            <Select label="Sort by" value={sort} onChange={(e) => update('sort', e.target.value)}>
              <option value="">Top rated</option>
              <option value="rate_asc">Price: low to high</option>
              <option value="rate_desc">Price: high to low</option>
              <option value="experience">Most experienced</option>
            </Select>
          </div>
          {(activeFilters > 0 || sort) && (
            <button onClick={clearAll} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-danger">
              <X size={14} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Quick location chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: 'location', val: 'home', label: 'Home visits', icon: Home },
          { key: 'location', val: 'hospital', label: 'Hospital care', icon: Building2 },
        ].map((chip) => {
          const active = params.get(chip.key) === chip.val;
          return (
            <button
              key={chip.val}
              onClick={() => update(chip.key, active ? '' : chip.val)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                active ? 'bg-brand-600 text-white' : 'bg-white text-ink-soft ring-1 ring-slate-200 hover:ring-brand-300'
              }`}
            >
              <chip.icon size={15} /> {chip.label}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {loading ? (
        <Spinner label="Finding caregivers…" />
      ) : caregivers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No caregivers found"
          message="Try widening your search or clearing some filters."
          action={<Button variant="outline" onClick={clearAll}>Clear filters</Button>}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-muted">{caregivers.length} verified caregiver{caregivers.length !== 1 ? 's' : ''} available</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {caregivers.map((c) => <CaregiverCard key={c.id} caregiver={c} />)}
          </div>
        </>
      )}
    </div>
  );
}
