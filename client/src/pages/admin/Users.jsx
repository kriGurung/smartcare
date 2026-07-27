import { useEffect, useState, useCallback } from 'react';
import { Users as UsersIcon, Search, Ban, CheckCircle2, ShieldCheck } from 'lucide-react';
import api, { errMsg } from '../../services/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Select } from '../../components/ui/Field.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { formatDate } from '../../lib/format.js';

const ROLE_TONE = { patient: 'brand', caregiver: 'care', admin: 'muted' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { role: role || undefined, status: status || undefined, q: q || undefined } });
      setUsers(res.data.users || []);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [role, status, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0); // debounce search
    return () => clearTimeout(t);
  }, [load, q]);

  async function toggleStatus(u) {
    const next = u.status === 'suspended' ? 'active' : 'suspended';
    setBusyId(u.id);
    setError('');
    try {
      await api.put(`/admin/users/${u.id}/status`, { status: next });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: next } : x)));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage patients and caregivers." icon={UsersIcon} />

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      {/* Filters */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="input-base pl-10" />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="patient">Patients</option>
          <option value="caregiver">Caregivers</option>
          <option value="admin">Admins</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>

      {loading ? (
        <Spinner label="Loading users…" />
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" message="Try adjusting your filters." />
      ) : (
        <Card>
          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">{u.name}</p>
                      {u.caregiverProfile?.verification_status === 'verified' && <ShieldCheck size={15} className="text-care-500" />}
                    </div>
                    <p className="text-xs text-ink-muted">{u.email} · joined {formatDate(u.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge>
                  <Badge tone={u.status === 'active' ? 'success' : 'danger'}>{u.status}</Badge>
                  {u.role !== 'admin' && (
                    <Button
                      size="sm"
                      variant={u.status === 'suspended' ? 'care' : 'outline'}
                      icon={u.status === 'suspended' ? CheckCircle2 : Ban}
                      loading={busyId === u.id}
                      onClick={() => toggleStatus(u)}
                    >
                      {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
