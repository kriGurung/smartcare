import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BadgeCheck, MapPin, Search, Star, ArrowRight, Calendar } from 'lucide-react';
import api from '../../services/api.js';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';

const fallback = [
  { id:'sita-sharma', name:'Sita Sharma', city:'Kathmandu', role:'Elderly care & daily support', hourlyRatePaisa:35000, profilePhotoUrl:'/images/caregivers/caregiver-sita-sharma.jpg', services:[] },
  { id:'ram-bahadur-thapa', name:'Ram Bahadur Thapa', city:'Lalitpur', role:'Hospital sitter & recovery support', hourlyRatePaisa:30000, profilePhotoUrl:'/images/caregivers/caregiver-ram-bahadur-thapa.jpg', services:[] },
  { id:'anita-gurung', name:'Anita Gurung', city:'Kathmandu', role:'Maternity & newborn support', hourlyRatePaisa:40000, profilePhotoUrl:'/images/caregivers/caregiver-anita-gurung.jpg', services:[] },
  { id:'bikash-rai', name:'Bikash Rai', city:'Bhaktapur', role:'Physiotherapy assist & mobility', hourlyRatePaisa:28000, profilePhotoUrl:'/images/caregivers/caregiver-bikash-rai.jpg', services:[] },
];
const services=['Elderly Care','Post-Surgery Care','Hospital Sitter','Disability Support','Palliative Care','Maternity & Newborn','Physiotherapy Assist','Medication Management'];

export default function FindCaregiver(){
  const [params,setParams]=useSearchParams();
  const [query,setQuery]=useState(params.get('q')||'');
  const [city,setCity]=useState(params.get('city')||'All locations');
  const [service,setService]=useState(params.get('service')||'All services');
  const [date,setDate]=useState(params.get('date')||'');
  const [caregivers,setCaregivers]=useState(fallback);
  const [loading,setLoading]=useState(false);
  const [total,setTotal]=useState(0);
  const [page,setPage]=useState(1);
  const [totalPages,setTotalPages]=useState(1);

  function fetchCaregivers(p=1){
    setLoading(true);
    const qp = new URLSearchParams();
    if(query) qp.set('q', query);
    if(city!=='All locations') qp.set('city', city);
    if(service!=='All services') qp.set('service', service);
    if(date) qp.set('date', date);
    qp.set('page', String(p));
    qp.set('limit', '12');

    api.get(`/caregivers?${qp.toString()}`).then(r=>{
      const data=r.data;
      if(Array.isArray(data.caregivers) && data.caregivers.length){
        setCaregivers(data.caregivers);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || 1);
      } else {
        setCaregivers(fallback);
        setTotal(0);
      }
    }).catch(()=>{
      setCaregivers(fallback);
    }).finally(()=>setLoading(false));
  }

  useEffect(()=>{fetchCaregivers(1);},[]);

  const handleSearch=()=>{setPage(1);fetchCaregivers(1);};
  const clear=()=>{setQuery('');setCity('All locations');setService('All services');setDate('');setPage(1);};

  return <>
    <section className="bg-[#e8f1ed] py-16 sm:py-20"><div className="page-shell"><span className="eyebrow">Find support</span><h1 className="display mt-4 max-w-2xl text-5xl font-bold sm:text-6xl">A care plan can start with the right person.</h1><p className="mt-5 max-w-xl text-muted-foreground">Browse caregiver profiles by service and location. Compare available profiles before requesting care.</p></div></section>
    <section className="page-shell py-12 sm:py-16">
      <div className="card-base grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:p-5">
        <label className="relative"><Search className="absolute left-4 top-3.5 text-muted-foreground" size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()} className="input-base pl-11" placeholder="Search by name or care type"/></label>
        <select value={service} onChange={e=>setService(e.target.value)} className="input-base"><option>All services</option>{services.map(x=><option key={x}>{x}</option>)}</select>
        <select value={city} onChange={e=>setCity(e.target.value)} className="input-base"><option>All locations</option>{['Kathmandu','Lalitpur','Pokhara','Bhaktapur'].map(x=><option key={x}>{x}</option>)}</select>
        <div className="relative"><Calendar className="absolute left-4 top-3.5 text-muted-foreground" size={17}/><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input-base pl-11" placeholder="Filter by date"/></div>
        <div className="flex gap-2"><button onClick={handleSearch} className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700">Search</button><button onClick={clear} className="rounded-xl border border-border px-4 py-3 text-sm font-bold text-primary transition hover:bg-muted">Clear</button></div>
      </div>

      <div className="mt-10 flex items-end justify-between">
        <div><span className="eyebrow">Caregiver directory</span><h2 className="display mt-2 text-3xl font-bold">Profiles to compare</h2></div>
        <span className="mono text-xs text-muted-foreground">{total || filteredCount(caregivers)} profiles</span>
      </div>

      {loading ? (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({length:6}).map((_,i)=><CardSkeleton key={i}/>)}
        </div>
      ) : caregivers.length ? (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {caregivers.map(person=><Link to={`/caregivers/${person.id}`} key={person.id} className="group card-base overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-soft">
            <div className="relative h-52 overflow-hidden bg-secondary">
              <img src={person.profilePhotoUrl||'/images/caregivers/caregiver-female-1.svg'} alt={person.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
              <span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-[11px] font-bold text-primary">{person.isAvailable===false?'Unavailable':'Available'}</span>
            </div>
            <div className="space-y-2 p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-ink group-hover:text-brand-600 transition">{person.name}</h3>
                {person.avgRating>0 && <span className="flex items-center gap-0.5 text-sm font-semibold text-amber-600"><Star size={14} fill="currentColor"/>{Number(person.avgRating).toFixed(1)}</span>}
              </div>
              {person.city && <p className="flex items-center gap-1 text-xs text-ink-muted"><MapPin size={13}/> {person.city}</p>}
              {person.services?.length>0 && <div className="flex flex-wrap gap-1.5">{person.services.slice(0,3).map(s=><span key={s.id||s} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">{s.name||s}</span>)}{person.services.length>3 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-ink-muted">+{person.services.length-3}</span>}</div>}
              <p className="pt-2 text-sm font-semibold text-brand-600">Rs. {(person.hourlyRatePaisa/100).toLocaleString()}/hr</p>
            </div>
          </Link>)}
        </div>
      ) : (
        <div className="mt-12 text-center py-12"><p className="text-ink-muted">No caregivers found matching your filters.</p><button onClick={clear} className="mt-3 text-sm font-semibold text-brand-600 hover:underline">Clear filters</button></div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button disabled={page<=1} onClick={()=>{setPage(page-1);fetchCaregivers(page-1);}} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-slate-50">Previous</button>
          <span className="text-sm text-ink-muted">Page {page} of {totalPages}</span>
          <button disabled={page>=totalPages} onClick={()=>{setPage(page+1);fetchCaregivers(page+1);}} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-slate-50">Next</button>
        </div>
      )}
    </section>
  </>;
}

function filteredCount(list){ return list.length; }
