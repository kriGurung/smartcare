import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, Stethoscope } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { errMsg } from '../../services/api.js';
import { ROLE_HOME } from '../../components/layout/navConfig.js';

function nameFromEmail(email){
  const prefix=String(email).split('@')[0].replace(/[._-]+/g,' ').trim();
  const formatted=prefix ? prefix.replace(/\b\w/g,c=>c.toUpperCase()) : '';
  return formatted.length >= 2 ? formatted : 'SmartCare User';
}

export default function Register(){
  const {register}=useAuth();
  const navigate=useNavigate();
  const [role,setRole]=useState('patient');
  const [form,setForm]=useState({email:'',phone:'',password:''});
  const [consent,setConsent]=useState(false);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  async function submit(e){
    e.preventDefault(); setError('');
    if(!consent) return setError('Please accept the privacy consent to continue.');
    if(form.password.length<8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try{
      const user=await register({name:nameFromEmail(form.email),email:form.email.trim(),phone:form.phone.trim(),password:form.password,role,consent:true});
      navigate(ROLE_HOME[user.role],{replace:true});
    }catch(e){setError(errMsg(e,'Could not create your account.'));}
    finally{setLoading(false);}
  }

  return <div className="grid min-h-dvh lg:grid-cols-2">
    <div className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between"><Link to="/" className="flex items-center gap-2.5 text-white"><img src="/logo-mark.svg" alt="SmartCare" className="h-9 w-9"/><span className="display text-[1.35rem] font-bold tracking-tight">smartcare</span></Link><div><span className="eyebrow text-secondary">SmartCare Nepal</span><h1 className="display mt-5 max-w-lg text-6xl font-bold">Care is a team effort.</h1><p className="mt-6 max-w-md leading-7 text-primary-foreground/75">A calm place to find support, coordinate bookings and keep the people you love close to the plan.</p></div><p className="text-xs text-primary-foreground/60">For families, caregivers and care teams.</p></div>
    <div className="flex items-center justify-center bg-background p-6 sm:p-12"><div className="w-full max-w-md"><div className="mb-14 lg:hidden"><Link to="/" className="flex items-center gap-2.5"><img src="/logo-mark.svg" alt="SmartCare" className="h-9 w-9"/><span className="display text-[1.35rem] font-bold">smartcare</span></Link></div><span className="eyebrow">Create your account</span><h2 className="display mt-4 text-4xl font-bold">Begin with care.</h2><p className="mt-3 text-sm text-muted-foreground">Choose how you will use SmartCare.</p><div className="mt-7 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">{[['patient','Family / patient',HeartHandshake],['caregiver','Caregiver',Stethoscope]].map(([value,label,Icon])=><button key={value} type="button" onClick={()=>setRole(value)} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition ${role===value?'bg-card text-primary shadow-sm':'text-muted-foreground'}`}><Icon size={14}/>{label}</button>)}</div>{error&&<div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}<form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm font-semibold">Email address<input type="email" required autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input-base mt-2" placeholder="you@example.com"/></label><label className="block text-sm font-semibold">Password<input type="password" required autoComplete="new-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="input-base mt-2" placeholder="Enter your password"/></label><label className="block text-sm font-semibold">Phone number<input type="tel" required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="input-base mt-2" placeholder="98XXXXXXXX"/></label><label className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"/><span className="text-xs leading-5 text-muted-foreground">I agree to SmartCare processing my information to provide care services, and accept the privacy policy.</span></label><button type="submit" disabled={loading} className="w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">{loading?'Creating account...':'Create account'}</button></form><p className="mt-7 text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="font-bold text-primary">Sign in</Link></p></div></div>
    <footer className="absolute bottom-0 left-0 right-0 border-t border-border bg-card/95 px-6 py-5 backdrop-blur"><div className="page-shell flex flex-col justify-between gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center"><span>&copy; {new Date().getFullYear()} SmartCare Nepal. All rights reserved.</span><span>Made in Kathmandu for families across Nepal.</span></div></footer>
  </div>;
}
