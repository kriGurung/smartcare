import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Check, Percent, Megaphone } from 'lucide-react';
import api, { errMsg } from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import { Input, Textarea } from '../../components/ui/Field.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export default function AdminSettings() {
  const [commission, setCommission] = useState(10);
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/settings').then((r) => {
      setCommission(r.data.settings.commission_percent ?? 10);
      setBanner(r.data.settings.banner ?? '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    const pct = Number(commission);
    if (Number.isNaN(pct) || pct < 0 || pct > 50) return setError('Commission must be between 0 and 50%.');
    setSaving(true);
    try {
      await api.put('/admin/settings', { commission_percent: pct, banner });
      setSaved(true);
    } catch (e) {
      setError(errMsg(e, 'Could not save settings.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner label="Loading settings…" />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Platform settings" subtitle="Configure commission and site-wide messaging." icon={SettingsIcon} />

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <form onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader title="Commission" subtitle="Platform fee taken from each completed booking." icon={Percent} />
          <CardBody>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Input id="commission" type="number" min="0" max="50" step="0.5" label="Commission rate (%)" value={commission} onChange={(e) => { setCommission(e.target.value); setSaved(false); }} />
              </div>
              <div className="rounded-xl bg-brand-50 px-4 py-3 text-center">
                <p className="text-xs text-brand-700/70">Caregiver keeps</p>
                <p className="text-lg font-bold text-brand-700">{(100 - Number(commission || 0)).toFixed(0)}%</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-ink-muted">Applied to new bookings. Existing bookings keep their original split.</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Homepage banner" subtitle="Shown to all visitors at the top of the site. Leave blank to hide." icon={Megaphone} />
          <CardBody>
            <Textarea id="banner" rows={2} value={banner} onChange={(e) => { setBanner(e.target.value); setSaved(false); }} placeholder="e.g. New: hospital care now available in Pokhara!" />
          </CardBody>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving} icon={saved ? Check : Save}>{saved ? 'Saved' : 'Save settings'}</Button>
          {saved && <span className="text-sm font-medium text-care-600">Settings updated.</span>}
        </div>
      </form>
    </div>
  );
}
