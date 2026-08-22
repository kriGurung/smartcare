import { ArrowRight, CheckCircle2, HeartHandshake, Hospital, Stethoscope, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const services = [
  ['Elderly care', 'Companionship, daily routines, medication reminders and practical support at home.', HeartHandshake],
  ['Post-surgery care', 'A calm, reliable presence during recovery, from mobility support to meal preparation.', Stethoscope],
  ['Hospital sitting', 'Trusted overnight and daytime support for loved ones during a hospital stay.', Hospital],
  ['Disability support', 'Respectful assistance with personal care, transfers and everyday independence.', Users],
];

export default function Services() {
  return (
    <div className="min-h-dvh">
      <section className="bg-brand-50">
        <div className="page-shell py-16 sm:py-24">
          <span className="eyebrow">Care that fits real life</span>
          <h1 className="display mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">Support for every chapter of care.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">From a little help at home to hands-on recovery support, SmartCare helps your family find the right person for the moments that matter.</p>
        </div>
      </section>
      <section className="page-shell section-space">
        <div className="grid gap-5 md:grid-cols-2">
          {services.map(([title, desc, Icon]) => (
            <article key={title} className="card-base p-7 sm:p-9">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon size={24} /></div>
              <h2 className="display mt-6 text-2xl font-bold">{title}</h2>
              <p className="mt-3 max-w-md leading-7 text-muted-foreground">{desc}</p>
              <Link to="/find-caregivers" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">Find care for this service <ArrowRight size={15} /></Link>
            </article>
          ))}
        </div>
        <div className="soft-panel mt-10 grid gap-4 p-7 sm:grid-cols-3 sm:p-9">
          {['Verified profiles', 'Clear hourly pricing', 'Care notes for family'].map((item) => <div key={item} className="flex items-center gap-2 font-semibold"><CheckCircle2 className="text-primary" size={19} />{item}</div>)}
        </div>
      </section>
    </div>
  );
}