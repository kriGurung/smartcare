import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, ChevronDown, ClipboardList, HeartHandshake, Search, ShieldCheck, Star, Stethoscope, Users, Activity, Hospital, WalletCards, BadgeCheck, MapPin, Phone } from 'lucide-react';

const caregivers = [
  { id:'sita-sharma', name:'Sita Sharma', role:'Elderly care & daily support', city:'Kathmandu', rate:'NPR 350 / hour', image:'/images/caregivers/caregiver-sita-sharma.jpg' },
  { id:'ram-bahadur-thapa', name:'Ram Bahadur Thapa', role:'Hospital sitter & recovery support', city:'Lalitpur', rate:'NPR 300 / hour', image:'/images/caregivers/caregiver-ram-bahadur-thapa.jpg' },
  { id:'anita-gurung', name:'Anita Gurung', role:'Maternity & newborn support', city:'Kathmandu', rate:'NPR 400 / hour', image:'/images/caregivers/caregiver-anita-gurung.jpg' },
  { id:'bikash-rai', name:'Bikash Rai', role:'Physiotherapy assist & mobility', city:'Bhaktapur', rate:'NPR 280 / hour', image:'/images/caregivers/caregiver-bikash-rai.jpg' },
];

const services = [
  ['Elderly Care','Daily companionship, medication reminders and help with routines around the home.',HeartHandshake,'bg-brand-50 text-brand-600'],
  ['Post-Surgery Care','Recovery support after hospital discharge — wound care, mobility, and meal prep.',Activity,'bg-blue-50 text-blue-600'],
  ['Hospital Sitter','A trusted person to stay with your family member during overnight hospital stays.',Hospital,'bg-care-50 text-care-700'],
  ['Disability Support','Assistive care that respects independence — personal care, transfers and daily tasks.',Users,'bg-purple-50 text-purple-600'],
  ['Palliative Care','Comfort-focused care for serious illness — pain management, dignity and family support.',Stethoscope,'bg-rose-50 text-rose-600'],
  ['Maternity & Newborn','Postpartum recovery, newborn care guidance and light household help for new mothers.',HeartHandshake,'bg-amber-50 text-amber-600'],
  ['Physiotherapy Assist','Exercise support, mobility routines and rehabilitation guidance at home.',Activity,'bg-orange-50 text-orange-600'],
  ['Medication Management','Prescription tracking, dosage reminders and care log updates for the family.',ClipboardList,'bg-sky-50 text-sky-600'],
];

const features = [
  { icon: ShieldCheck, color:'text-primary', title:'Verified caregivers', desc:'Every caregiver profile is reviewed before going live. Background checks and reference calls are part of the process.' },
  { icon: CalendarDays, color:'text-primary', title:'Clear availability', desc:'See when each caregiver is free. Request specific dates and times that work for your family schedule.' },
  { icon: WalletCards, color:'text-accent', title:'Upfront pricing', desc:'Hourly rates are shown on every profile. No hidden fees, no surprises after the care visit.' },
  { icon: ClipboardList, color:'text-accent', title:'Care updates', desc:'Caregivers log what happened during each visit. Families see the notes in their dashboard.' },
];

export default function Home() {
  const [service, setService] = useState('');
  const [city, setCity] = useState('');
  const browseHref = service || city ? `/find-caregivers?${new URLSearchParams({ ...(service ? { service } : {}), ...(city ? { city } : {}) }).toString()}` : '/find-caregivers';

  return (
    <div className="min-h-dvh overflow-hidden">
      {/* ── Hero ── */}
      <section className="bg-brand-50">
        <div className="page-shell grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
          <div className="animate-rise">
            <span className="eyebrow">Care coordination for Nepali families</span>
            <h1 className="display mt-5 max-w-xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-[4.25rem]">Trusted caregivers, <em className="text-primary">clear for the family.</em></h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">SmartCare helps you find background-checked caregivers for home and hospital care in Kathmandu, Lalitpur, Bhaktapur and Pokhara. Compare profiles, request care and keep everyone informed.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/find-caregivers" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110">Find a caregiver <ArrowRight size={16} /></Link>
              <Link to="/how-it-works" className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-card px-6 py-3 text-sm font-bold text-foreground transition hover:bg-card/80">How it works</Link>
            </div>
            <div className="mt-8 flex items-center gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="text-primary" size={16}/> Profiles reviewed</span>
              <span className="flex items-center gap-1.5"><Phone className="text-primary" size={16}/> Support by phone</span>
              <span className="flex items-center gap-1.5"><MapPin className="text-primary" size={16}/> 4 cities</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[480px] animate-rise">
            <div className="relative aspect-[.88] overflow-hidden rounded-[2rem] rounded-br-[6rem] shadow-soft">
              <img src="/images/caregivers/caregiver-sita-sharma.jpg" alt="SmartCare caregiver providing home support in Kathmandu" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-4 right-4 max-w-[220px] rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><HeartHandshake size={18}/></div>
                <div>
                  <p className="text-xs font-bold">Care logs</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Family sees every visit update</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-background [clip-path:ellipse(55%_100%_at_50%_100%)]" />
      </section>

      {/* ── Search bar ── */}
      <section className="page-shell relative z-10 -mt-2 pb-16 sm:pb-20">
        <div className="card-base grid gap-4 p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center sm:p-5">
          <div className="hidden sm:block"><span className="eyebrow">Start here</span><p className="mt-1.5 text-sm font-semibold">What kind of care?</p></div>
          <label className="relative block"><span className="sr-only">Choose a service</span><select className="input-base appearance-none" value={service} onChange={(e)=>setService(e.target.value)}><option value="">Choose a service</option>{services.map(([name])=><option key={name}>{name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-3.5 text-muted-foreground" size={17}/></label>
          <label className="relative block"><span className="sr-only">Choose a city</span><select className="input-base appearance-none" value={city} onChange={(e)=>setCity(e.target.value)}><option value="">Choose a location</option>{['Kathmandu','Lalitpur','Pokhara','Bhaktapur'].map(x=><option key={x}>{x}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-3.5 text-muted-foreground" size={17}/></label>
          <Link to={browseHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition hover:brightness-95">Search <Search size={16}/></Link>
        </div>
      </section>

      {/* ── Services grid ── */}
      <section className="page-shell pb-16 sm:pb-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><span className="eyebrow">Types of care</span><h2 className="display mt-3 text-3xl font-bold sm:text-4xl">What families ask for most.</h2></div>
          <Link to="/find-caregivers" className="hidden text-sm font-bold text-primary sm:block">Browse all <ArrowRight className="ml-1 inline" size={14}/></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(([name,description,Icon,iconBg],i)=>(
            <Link to={`/find-caregivers?service=${encodeURIComponent(name)}`} key={name} className="group rounded-2xl border border-border bg-card p-5 transition duration-200 hover:shadow-soft">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}><Icon size={20}/></div>
              <h3 className="font-semibold text-foreground">{name}</h3>
              <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-brand-50 py-16 sm:py-24">
        <div className="page-shell grid items-start gap-12 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <span className="eyebrow text-primary">What SmartCare does</span>
            <h2 className="display mt-4 text-3xl font-bold leading-tight sm:text-4xl">Care details that stay organized.</h2>
            <p className="mt-4 max-w-md text-muted-foreground leading-7">Instead of scattered phone calls and messages, SmartCare keeps profiles, bookings and care updates in one place the whole family can check.</p>
            <Link to="/how-it-works" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">See how it works <ArrowRight size={15}/></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map(({icon:Icon,color,title,desc})=>(
              <div key={title} className="rounded-2xl border border-border bg-card p-5">
                <Icon className={color} size={24}/>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Caregivers ── */}
      <section className="page-shell py-16 sm:py-24">
        <div className="flex items-end justify-between gap-4">
          <div><span className="eyebrow">Caregivers on SmartCare</span><h2 className="display mt-3 text-3xl font-bold sm:text-4xl">Start with someone you trust.</h2></div>
          <Link to="/find-caregivers" className="hidden text-sm font-bold text-primary sm:block">View all <ArrowRight className="ml-1 inline" size={14}/></Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {caregivers.map((person)=>(
            <Link to={`/caregivers/${person.id}`} key={person.id} className="group card-base overflow-hidden transition duration-200 hover:shadow-soft">
              <div className="relative h-48 overflow-hidden bg-secondary">
                <img src={person.image} alt={person.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
                <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-0.5 text-[11px] font-bold text-primary">Available</span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{person.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{person.role}</p>
                  </div>
                  <BadgeCheck className="shrink-0 text-primary" size={16}/>
                </div>
                <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin size={12}/>{person.city}</span>
                  <span className="flex items-center gap-1"><Star size={12} className="fill-accent text-accent"/> Profile</span>
                </div>
                <div className="mt-3 border-t border-border pt-2.5 text-xs font-semibold text-primary">{person.rate}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="page-shell pb-16 sm:pb-24">
        <div className="overflow-hidden rounded-2xl bg-primary px-8 py-12 text-primary-foreground sm:px-14 sm:py-16">
          <div className="max-w-xl">
            <span className="eyebrow text-secondary">For families in Nepal</span>
            <h2 className="display mt-4 text-3xl font-bold sm:text-4xl">Every family deserves a care plan that works.</h2>
            <p className="mt-4 max-w-lg leading-7 text-primary-foreground/75">Create a free account, tell us what your family needs and compare caregiver profiles in your area. No commitment until you find the right person.</p>
            <Link to="/register" className="mt-6 inline-flex items-center gap-2 rounded-full bg-card px-6 py-3 text-sm font-bold text-primary transition hover:brightness-95">Create an account <ArrowRight size={15}/></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
