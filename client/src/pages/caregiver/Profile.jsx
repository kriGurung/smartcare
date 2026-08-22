import { useEffect, useRef, useState } from 'react';
import {
  UserCog, Save, Check, Camera, Upload, FileText, ShieldCheck, ShieldAlert,
  Home, Building2, Loader2,
} from 'lucide-react';
import api, { errMsg } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Input, Textarea, Select, Label } from '../../components/ui/Field.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { DOC_TYPES, VERIFICATION_META } from '../../lib/constants.js';

export default function CaregiverProfileEdit() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [verification, setVerification] = useState('pending');
  const photoInput = useRef(null);

  const [form, setForm] = useState({
    bio: '', years_experience: 0, hourly_rate_npr: '', city: '', gender: '',
    languages: '', serves_home: true, serves_hospital: true, is_available: true, serviceIds: [],
  });
  const [completion, setCompletion] = useState(0);

  async function loadAll() {
    try {
      const [meRes, svcRes, docRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/services'),
        api.get(`/caregivers/${user.id}/documents`).catch(() => ({ data: { documents: [] } })),
      ]);
      const u = meRes.data.user;
      const p = u.caregiverProfile || {};
      setForm({
        bio: p.bio || '',
        years_experience: p.years_experience || 0,
        hourly_rate_npr: p.hourly_rate_paisa ? p.hourly_rate_paisa / 100 : '',
        city: p.city || '',
        gender: p.gender || '',
        languages: p.languages || '',
        serves_home: p.serves_home ?? true,
        serves_hospital: p.serves_hospital ?? true,
        is_available: p.is_available ?? true,
        serviceIds: (u.services || []).map((s) => s.id),
      });
      setPhotoUrl(p.profile_photo_url || null);
      setVerification(p.verification_status || 'pending');
      setCompletion(u.profile_completion || 0);
      setServices(svcRes.data.services || []);
      setDocuments(docRes.data.documents || []);
    } catch (e) {
      setError(errMsg(e, 'Could not load your profile.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); setSaved(false); }
  function toggleService(id) {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id],
    }));
    setSaved(false);
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.put(`/caregivers/${user.id}`, {
        bio: form.bio,
        years_experience: Number(form.years_experience) || 0,
        hourly_rate_npr: Number(form.hourly_rate_npr) || 0,
        city: form.city,
        gender: form.gender || undefined,
        languages: form.languages,
        serves_home: form.serves_home,
        serves_hospital: form.serves_hospital,
        is_available: form.is_available,
        serviceIds: form.serviceIds,
      });
      setSaved(true);
    } catch (e) {
      setError(errMsg(e, 'Could not save your profile.'));
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const res = await api.put(`/caregivers/${user.id}/photo`, fd);
      setPhotoUrl(res.data.profile_photo_url);
    } catch (e) {
      setError(errMsg(e, 'Could not upload photo.'));
    }
  }

  const vMeta = VERIFICATION_META[verification] || VERIFICATION_META.pending;

  if (loading) return <Spinner label="Loading your profile…" />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Caregiver profile" subtitle="Complete your profile and get verified to start receiving bookings." icon={UserCog} />

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      {/* Header + photo + verification */}
      <Card className="mb-6">
        <CardBody className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            <Avatar name={user.name} src={photoUrl || undefined} size="xl" />
            <button onClick={() => photoInput.current?.click()} className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-white shadow-lift ring-2 ring-white transition hover:bg-brand-700" aria-label="Change photo">
              <Camera size={16} />
            </button>
            <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-ink">{user.name}</h2>
            <p className="text-sm text-ink-muted">{user.email}</p>
            <div className="mt-2 flex justify-center sm:justify-start">
              <Badge tone={vMeta.tone} icon={verification === 'verified' ? ShieldCheck : ShieldAlert}>{vMeta.label}</Badge>
            </div>
            <div className="mt-3 max-w-xs">
              <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
                <span>Profile completion</span>
                <span>{completion}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full rounded-full transition-all duration-500 ${completion === 100 ? 'bg-care-500' : 'bg-brand-500'}`} style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <form onSubmit={save} className="space-y-6">
        {/* About */}
        <Card>
          <CardHeader title="About you" subtitle="This is what patients see on your profile." />
          <CardBody className="space-y-4">
            <Textarea id="bio" label="Bio" rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Introduce yourself, your caregiving approach and experience…" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="exp" type="number" min="0" max="70" label="Years of experience" value={form.years_experience} onChange={(e) => set('years_experience', e.target.value)} />
              <Input id="rate" type="number" min="0" label="Hourly rate (Rs.)" value={form.hourly_rate_npr} onChange={(e) => set('hourly_rate_npr', e.target.value)} placeholder="e.g. 300" />
              <Input id="city" label="City" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Kathmandu" />
              <Select id="gender" label="Gender" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </Select>
              <Input id="lang" label="Languages" className="sm:col-span-2" value={form.languages} onChange={(e) => set('languages', e.target.value)} placeholder="e.g. Nepali, English, Hindi" />
            </div>
          </CardBody>
        </Card>

        {/* Care settings */}
        <Card>
          <CardHeader title="Care settings" />
          <CardBody className="space-y-4">
            <div>
              <Label>Where do you provide care?</Label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => set('serves_home', !form.serves_home)} className={`flex items-center gap-3 rounded-2xl border p-4 transition ${form.serves_home ? 'border-brand-600 bg-brand-50' : 'border-slate-200'}`}>
                  <Home size={20} className={form.serves_home ? 'text-brand-600' : 'text-ink-muted'} />
                  <span className="text-sm font-semibold text-ink">Home visits</span>
                  {form.serves_home && <Check size={18} className="ml-auto text-brand-600" />}
                </button>
                <button type="button" onClick={() => set('serves_hospital', !form.serves_hospital)} className={`flex items-center gap-3 rounded-2xl border p-4 transition ${form.serves_hospital ? 'border-care-500 bg-care-50' : 'border-slate-200'}`}>
                  <Building2 size={20} className={form.serves_hospital ? 'text-care-600' : 'text-ink-muted'} />
                  <span className="text-sm font-semibold text-ink">Hospital care</span>
                  {form.serves_hospital && <Check size={18} className="ml-auto text-care-600" />}
                </button>
              </div>
            </div>

            <label className="flex items-center justify-between rounded-xl bg-surface-sunken p-3.5">
              <span className="text-sm font-medium text-ink-soft">Available for new bookings</span>
              <button type="button" onClick={() => set('is_available', !form.is_available)} className={`relative h-6 w-11 rounded-full transition ${form.is_available ? 'bg-care-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${form.is_available ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </label>
          </CardBody>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader title="Services offered" subtitle="Select all the services you provide." />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => {
                const on = form.serviceIds.includes(s.id);
                return (
                  <button key={s.id} type="button" onClick={() => toggleService(s.id)} className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-soft hover:border-slate-300'}`}>
                    {on && <Check size={14} className="mr-1 inline" />}{s.name}
                  </button>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving} icon={saved ? Check : Save}>{saved ? 'Saved' : 'Save profile'}</Button>
          {saved && <span className="text-sm font-medium text-care-600">Profile updated.</span>}
        </div>
      </form>

      {/* Documents / verification */}
      <Card className="mt-8">
        <CardHeader title="Verification documents" subtitle="Upload these for admin review. You'll be verified once approved." icon={ShieldCheck} />
        <CardBody>
          <div className="space-y-3">
            {DOC_TYPES.map((dt) => {
              const uploaded = documents.filter((d) => d.docType === dt.id);
              const latest = uploaded[0];
              return <DocRow key={dt.id} docType={dt} latest={latest} userId={user.id} onUploaded={loadAll} onError={setError} />;
            })}
          </div>
          {verification !== 'verified' && (
            <p className="mt-4 text-xs text-ink-muted">Uploading or re-uploading a document sends your profile for review.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function DocRow({ docType, latest, userId, onUploaded, onError }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    onError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doc_type', docType.id);
      await api.post(`/caregivers/${userId}/documents`, fd);
      await onUploaded();
    } catch (err) {
      onError(errMsg(err, 'Could not upload document.'));
    } finally {
      setUploading(false);
    }
  }

  const statusMeta = latest ? (VERIFICATION_META[latest.status] || VERIFICATION_META.pending) : null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-sunken text-ink-soft"><FileText size={18} /></span>
        <div>
          <p className="font-medium text-ink">{docType.label}</p>
          {latest ? (
            <p className="truncate text-xs text-ink-muted">{latest.originalName}</p>
          ) : (
            <p className="text-xs text-ink-faint">Not uploaded</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {statusMeta && <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>}
        <Button size="sm" variant="outline" icon={uploading ? undefined : Upload} loading={uploading} onClick={() => inputRef.current?.click()}>
          {latest ? 'Replace' : 'Upload'}
        </Button>
        <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={upload} />
      </div>
    </div>
  );
}
