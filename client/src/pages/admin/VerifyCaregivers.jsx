import { useEffect, useState } from 'react';
import {
  ShieldCheck, ShieldX, FileText, Check, X, Briefcase, MapPin, ChevronRight,
  Loader2, BadgeCheck,
} from 'lucide-react';
import api, { errMsg } from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import AuthImage from '../../components/AuthImage.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Textarea } from '../../components/ui/Field.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { VERIFICATION_META } from '../../lib/constants.js';

export default function VerifyCaregivers() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  async function loadPending() {
    setLoading(true);
    try {
      const res = await api.get('/admin/caregivers/pending');
      setPending(res.data.caregivers || []);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadPending(); }, []);

  async function openCaregiver(c) {
    setSelected(c);
    setDocsLoading(true);
    setError('');
    try {
      const res = await api.get(`/admin/caregivers/${c.id}/documents`);
      setDocs(res.data.documents || []);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setDocsLoading(false);
    }
  }

  async function reviewDoc(docId, status) {
    try {
      await api.put(`/admin/documents/${docId}/review`, { status });
      setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, status } : d)));
    } catch (e) {
      setError(errMsg(e));
    }
  }

  async function verify() {
    setBusy(true);
    setError('');
    try {
      await api.put(`/admin/caregivers/${selected.id}/verify`);
      setSelected(null);
      await loadPending();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!reason.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api.put(`/admin/caregivers/${selected.id}/reject`, { reason: reason.trim() });
      setRejectOpen(false);
      setReason('');
      setSelected(null);
      await loadPending();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner label="Loading verification queue…" />;

  return (
    <div>
      <PageHeader title="Caregiver verification" subtitle="Review documents and approve caregivers to list them." icon={ShieldCheck} />

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      {pending.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="All caught up" message="There are no caregivers awaiting verification right now." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pending.map((c) => (
            <button key={c.id} onClick={() => openCaregiver(c)} className="card-base group p-5 text-left transition hover:shadow-lift">
              <div className="flex items-center gap-3">
                <Avatar name={c.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{c.name}</p>
                  <p className="truncate text-xs text-ink-muted">{c.email}</p>
                </div>
                <Badge tone="warning">Pending</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-muted">
                {c.city && <span className="flex items-center gap-1"><MapPin size={13} /> {c.city}</span>}
                {c.yearsExperience > 0 && <span className="flex items-center gap-1"><Briefcase size={13} /> {c.yearsExperience} yr</span>}
                <span className="flex items-center gap-1"><FileText size={13} /> {c.documents?.length || 0} docs</span>
              </div>
              <div className="mt-4 flex items-center justify-end text-sm font-semibold text-brand-600 group-hover:gap-1">Review <ChevronRight size={16} /></div>
            </button>
          ))}
        </div>
      )}

      {/* Review modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Review — ${selected.name}` : ''}
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" icon={X} onClick={() => setRejectOpen(true)}>Reject</Button>
            <Button variant="care" icon={ShieldCheck} loading={busy} onClick={verify}>Verify caregiver</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="rounded-xl bg-surface-muted p-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p><span className="text-ink-muted">Phone:</span> <span className="font-medium text-ink">{selected.phone}</span></p>
                <p><span className="text-ink-muted">City:</span> <span className="font-medium text-ink">{selected.city || '—'}</span></p>
                <p><span className="text-ink-muted">Experience:</span> <span className="font-medium text-ink">{selected.yearsExperience || 0} years</span></p>
              </div>
              {selected.bio && <p className="mt-3 text-sm text-ink-soft">{selected.bio}</p>}
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-ink">Documents</h4>
              {docsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin-slow text-brand-600" /></div>
              ) : docs.length === 0 ? (
                <p className="rounded-xl bg-surface-sunken p-4 text-center text-sm text-ink-muted">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-4">
                  {docs.map((d) => {
                    const meta = VERIFICATION_META[d.status] || VERIFICATION_META.pending;
                    return (
                      <div key={d.id} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold capitalize text-ink">{d.docType.replace('_', ' ')}</p>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </div>
                        <AuthImage url={d.downloadUrl} alt={d.docType} className="mt-3 h-40 w-full" />
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="care" icon={Check} onClick={() => reviewDoc(d.id, 'approved')} className="flex-1">Approve</Button>
                          <Button size="sm" variant="outline" icon={X} onClick={() => reviewDoc(d.id, 'rejected')} className="flex-1">Reject</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject reason modal */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject caregiver"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="danger" icon={ShieldX} loading={busy} onClick={reject} disabled={!reason.trim()}>Confirm rejection</Button>
          </>
        }
      >
        <Textarea id="reason" label="Reason for rejection" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Let the caregiver know what needs to be corrected…" />
        <p className="mt-2 text-xs text-ink-muted">The caregiver will be notified and can re-submit their documents.</p>
      </Modal>
    </div>
  );
}
