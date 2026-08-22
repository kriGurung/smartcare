import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const locations = [
  ['Kathmandu', 'Baneshwor · Maharajgunj · Lazimpat'],
  ['Lalitpur', 'Patan · Jawalakhel · Kupondole'],
  ['Bhaktapur', 'Suryabinayak · Thimi · Sallaghari'],
];

export default function Locations() {
  return (
    <div className="min-h-dvh">
      <section className="bg-brand-50"><div className="page-shell py-16 sm:py-24"><span className="eyebrow">Care close to home</span><h1 className="display mt-4 max-w-2xl text-4xl font-bold sm:text-6xl">Find SmartCare in your neighborhood.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">We are growing across the Kathmandu Valley, connecting families with caregivers who understand their community.</p></div></section>
      <section className="page-shell section-space"><div className="grid gap-5 md:grid-cols-3">{locations.map(([name, areas]) => <article key={name} className="card-base p-7"><MapPin className="text-primary" size={25}/><h2 className="display mt-6 text-2xl font-bold">{name}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{areas}</p><Link to={`/find-caregivers?city=${name}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">Browse caregivers <ArrowRight size={15}/></Link></article>)}</div><p className="mt-10 text-center text-muted-foreground">Can’t see your area yet? <Link to="/contact" className="font-bold text-primary">Talk to our team</Link> about arranging care.</p></section>
    </div>
  );
}