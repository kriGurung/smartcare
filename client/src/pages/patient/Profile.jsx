import { useEffect, useState } from 'react';
import { UserCog, Save, Check } from 'lucide-react';
import api, { errMsg } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import { Input, Textarea, Select } from '../../components/ui/Field.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export default function PatientProfile() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', language_pref: 'en',
    address: '', city: '', emergency_contact: '', notes: '',
  });

  useEffect(() => {
    api.get('/users/me').then((r) => {
      const u = r.data.user;
      const p = u.patientProfile || {};
      setForm({
        name: u.name || '',
        phone: u.phone || '',
        language_pref: u.language_pref || 'en',
        address: p.address || '',
        city: p.city || '',
        emergency_contact: p.emergency_contact || '',
        notes: p.notes || '',
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); setSaved(false); }

  async function save(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.put('/users/me', form);
      await refreshUser();
      setSaved(true);
    } catch (e) {
      setError(errMsg(e, 'Could not save your profile.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner label="Loading your profile…" />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My profile" subtitle="Keep your details up to date for smoother bookings." icon={UserCog} />

      <Card className="mb-6">
        <CardBody className="flex items-center gap-4">
          <Avatar name={form.name || user.name} size="xl" />
          <div>
            <h2 className="text-xl font-bold text-ink">{form.name || user.name}</h2>
            <p className="text-sm text-ink-muted">{user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">Patient account</span>
          </div>
        </CardBody>
      </Card>

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <form onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader title="Personal details" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Input id="name" label="Full name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <Input id="phone" label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <Select id="lang" label="Preferred language" value={form.language_pref} onChange={(e) => set('language_pref', e.target.value)}>
              <option value="en">English</option>
              <option value="ne">नेपाली (Nepali)</option>
            </Select>
            <Input id="city" label="City" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Kathmandu" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Care details" subtitle="Helps caregivers prepare for visits." />
          <CardBody className="space-y-4">
            <Input id="address" label="Default address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, area" />
            <Input id="emergency" label="Emergency contact" value={form.emergency_contact} onChange={(e) => set('emergency_contact', e.target.value)} placeholder="Name & phone" />
            <Textarea id="notes" label="Care notes (private)" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Allergies, medical conditions, mobility needs…" />
            <p className="text-xs text-ink-muted">These notes are encrypted and only shared with caregivers you book.</p>
          </CardBody>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving} icon={saved ? Check : Save}>{saved ? 'Saved' : 'Save changes'}</Button>
          {saved && <span className="text-sm font-medium text-care-600">Your profile has been updated.</span>}
        </div>
      </form>
    </div>
  );
}
