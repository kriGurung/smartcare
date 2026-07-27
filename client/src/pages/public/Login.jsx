import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { errMsg } from '../../services/api.js';
import Logo from '../../components/Logo.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { ROLE_HOME } from '../../components/layout/navConfig.js';

const DEMO = [
  { label: 'Patient', email: 'hari@smartcare.local' },
  { label: 'Caregiver', email: 'sita@smartcare.local' },
  { label: 'Admin', email: 'admin@smartcare.local' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email.trim(), form.password);
      navigate(from || ROLE_HOME[user.role], { replace: true });
    } catch (e) {
      setError(errMsg(e, 'Could not sign you in.'));
    } finally {
      setLoading(false);
    }
  }

  function useDemo(email) {
    setForm({ email, password: 'Password123' });
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <Link to="/" className="inline-block"><Logo size={36} textClass="text-2xl" /></Link>
        <h1 className="mt-6 text-2xl font-bold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-muted">Sign in to manage your care.</p>
      </div>

      <div className="card-base p-6 sm:p-8">
        {error && <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <Input
            id="email" label="Email" type="email" autoComplete="email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
          <Input
            id="password" label="Password" type="password" autoComplete="current-password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Your password"
          />
          <Button type="submit" size="lg" icon={LogIn} loading={loading} className="w-full">Sign in</Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          New to SmartCare?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">Create an account</Link>
        </p>
      </div>

      {/* Demo accounts — convenient for the local build */}
      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted"><Info size={14} /> Demo accounts (password: Password123)</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              onClick={() => useDemo(d.email)}
              className="rounded-lg bg-surface-sunken px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-brand-50 hover:text-brand-700"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
