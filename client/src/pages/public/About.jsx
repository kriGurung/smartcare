import { HeartHandshake, ShieldCheck, Users } from 'lucide-react';

const values = [
  [ShieldCheck, 'Trust is earned', 'We review every caregiver profile and make the important details easy for families to see.'],
  [HeartHandshake, 'Care is personal', 'Good care starts with listening. We help families choose support that respects their routines and values.'],
  [Users, 'Families come first', 'Our goal is simple: make coordinating care feel less overwhelming and more human.'],
];

export default function About() {
  return <div className="min-h-dvh"><section className="bg-brand-50"><div className="page-shell py-16 sm:py-24"><span className="eyebrow">About SmartCare</span><h1 className="display mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">Making care coordination feel a little lighter.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">SmartCare was built for Nepali families who want dependable support without the uncertainty of searching alone.</p></div></section><section className="page-shell section-space"><div className="grid gap-5 md:grid-cols-3">{values.map(([Icon, title, desc]) => <article className="card-base p-7" key={title}><Icon className="text-primary" size={26}/><h2 className="display mt-6 text-2xl font-bold">{title}</h2><p className="mt-3 leading-7 text-muted-foreground">{desc}</p></article>)}</div></section></div>;
}