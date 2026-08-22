import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { errMsg } from '../../services/api.js';
import { ROLE_HOME } from '../../components/layout/navConfig.js';

export default function Login(){
  const {login}=useAuth();
  const navigate=useNavigate();
  const location=useLocation();
  const [form,setForm]=useState({email:'',password:''});
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const from=location.state?.from?.pathname;

  async function submit(e){
    e.preventDefault(); setError(''); setLoading(true);
    try{ const user=await login(form.email.trim(),form.password); navigate(from||ROLE_HOME[user.role],{replace:true}); }
    catch(e){ setError(errMsg(e,'Could not sign you in.')); }
    finally{ setLoading(false); }
  }

  return <div className="grid min-h-dvh lg:grid-cols-2">
    <div className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between"><Link to="/" className="flex items-center gap-2.5 text-white"><img src="/logo-mark.svg" alt="SmartCare" className="h-9 w-9"/><span className="display text-[1.35rem] font-bold tracking-tight">smartcare</span></Link><div><span className="eyebrow text-secondary">SmartCare Nepal</span><h1 className="display mt-5 max-w-lg text-6xl font-bold">Care is a team effort.</h1><p className="mt-6 max-w-md leading-7 text-primary-foreground/75">A calm place to find support, coordinate bookings and keep the people you love close to the plan.</p></div><p className="text-xs text-primary-foreground/60">For families, caregivers and care teams.</p></div>
    <div className="flex items-center justify-center bg-background p-6 sm:p-12"><div className="w-full max-w-md"><div className="mb-14 lg:hidden"><Link to="/" className="flex items-center gap-2.5"><img src="/logo-mark.svg" alt="SmartCare" className="h-9 w-9"/><span className="display text-[1.35rem] font-bold">smartcare</span></Link></div><span className="eyebrow">Welcome back</span><h2 className="display mt-4 text-4xl font-bold">Good to see you.</h2><p className="mt-3 text-sm text-muted-foreground">Sign in to continue to your SmartCare workspace.</p>{error&&<div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}<form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm font-semibold">Email address<input type="email" required autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input-base mt-2" placeholder="you@example.com"/></label><label className="block text-sm font-semibold">Password<input type="password" required autoComplete="current-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="input-base mt-2" placeholder="Enter your password"/></label><button type="submit" disabled={loading} className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">{loading?'Signing in...':'Sign in'}</button></form><p className="mt-7 text-center text-sm text-muted-foreground">New to SmartCare? <Link to="/register" className="font-bold text-primary">Create an account</Link></p></div></div>
  </div>;
}
