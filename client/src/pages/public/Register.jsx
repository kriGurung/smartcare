import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, HeartHandshake, Stethoscope } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { errMsg } from '../../services/api.js';
import Logo from '../../components/Logo.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { ROLE_HOME } from '../../components/layout/navConfig.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('patient');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!consent) return setError('Please accept the privacy consent to continue.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      const user = await register({ ...form, email: form.email.trim(), role, consent: true });
      navigate(ROLE_HOME[user.role], { replace: true });
    } catch (e) {
      setError(errMsg(e, 'Could not create your account.'));
    } finally {
      setLoading(false);
    }
  }

  const roles = [
    { id: 'patient', label: 'I need care', sub: 'Book caregivers for family', icon: HeartHandshake },
    { id: 'caregiver', label: "I'm a caregiver", sub: 'Offer care & earn', icon: Stethoscope },
  ];

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <Link to="/" className="inline-block"><Logo size={36} textClass="text-2xl" /></Link>
        <h1 className="mt-6 text-2xl font-bold text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-ink-muted">Join SmartCare in under a minute.</p>
      </div>

      <div className="card-base p-6 sm:p-8">
        {error && <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        {/* Role picker */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          {roles.map((r) => {
            const active = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition ${
                  active ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <r.icon size={22} className={active ? 'text-brand-600' : 'text-ink-muted'} />
                <span className="text-sm font-semibold text-ink">{r.label}</span>
                <span className="text-xs text-ink-muted">{r.sub}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Input id="name" label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
          <Input id="email" label="Email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          <Input id="phone" label="Phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" />
          <Input id="password" label="Password" hint="(min 8 characters)" type="password" autoComplete="new-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Create a password" />

          <label className="flex items-start gap-3 rounded-xl bg-surface-sunken p-3.5">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-600" />
            <span className="text-sm text-ink-soft">
              I agree to SmartCare processing my information to provide care services, and accept the privacy policy.
            </span>
          </label>

          <Button type="submit" size="lg" icon={UserPlus} loading={loading} className="w-full">Create account</Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
