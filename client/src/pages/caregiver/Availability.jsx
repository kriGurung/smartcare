import { useEffect, useState } from 'react';
import { CalendarRange, Save, Check } from 'lucide-react';
import api, { errMsg } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { WEEKDAYS } from '../../lib/constants.js';

const hhmm = (t) => (t ? String(t).slice(0, 5) : '');

export default function Availability() {
  const { user } = useAuth();
  const [rows, setRows] = useState(
    WEEKDAYS.map((_, i) => ({ day_of_week: i, enabled: false, start_time: '09:00', end_time: '17:00' }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/caregivers/${user.id}/availability`).then((r) => {
      const existing = r.data.availability || [];
      setRows((prev) =>
        prev.map((row) => {
          const found = existing.find((e) => e.day_of_week === row.day_of_week);
          return found
            ? { ...row, enabled: true, start_time: hhmm(found.start_time), end_time: hhmm(found.end_time) }
            : row;
        })
      );
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user.id]);

  function toggle(i) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, enabled: !r.enabled } : r)));
    setSaved(false);
  }
  function setTime(i, key, val) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
    setSaved(false);
  }

  async function save() {
    setError('');
    setSaving(true);
    try {
      const slots = rows
        .filter((r) => r.enabled)
        .map((r) => ({ day_of_week: r.day_of_week, start_time: r.start_time, end_time: r.end_time }));
      await api.put(`/caregivers/${user.id}/availability`, { slots });
      setSaved(true);
    } catch (e) {
      setError(errMsg(e, 'Could not save availability.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner label="Loading availability…" />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Weekly availability" subtitle="Turn on the days you're available and set your hours." icon={CalendarRange} />

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <Card>
        <div className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <div key={r.day_of_week} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className={`relative h-6 w-11 rounded-full transition ${r.enabled ? 'bg-brand-600' : 'bg-slate-300'}`}
                  aria-pressed={r.enabled}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${r.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
                <span className={`font-semibold ${r.enabled ? 'text-ink' : 'text-ink-faint'}`}>{WEEKDAYS[r.day_of_week]}</span>
              </label>
              {r.enabled ? (
                <div className="flex items-center gap-2">
                  <input type="time" value={r.start_time} onChange={(e) => setTime(i, 'start_time', e.target.value)} className="input-base w-32 py-2" />
                  <span className="text-ink-muted">to</span>
                  <input type="time" value={r.end_time} onChange={(e) => setTime(i, 'end_time', e.target.value)} className="input-base w-32 py-2" />
                </div>
              ) : (
                <span className="text-sm text-ink-faint">Unavailable</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save} loading={saving} icon={saved ? Check : Save}>{saved ? 'Saved' : 'Save availability'}</Button>
        {saved && <span className="text-sm font-medium text-care-600">Availability updated.</span>}
      </div>
    </div>
  );
}
