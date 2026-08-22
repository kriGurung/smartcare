import { Search, UserCheck, CreditCard, Bell, ShieldCheck } from 'lucide-react';

const capabilities = [
  { icon: Search, title:'Search by service and city', desc:'Filter caregivers by the type of care you need — elderly care, post-surgery, maternity, hospital sitting — and by your location in Kathmandu, Lalitpur, Bhaktapur or Pokhara.' },
  { icon: UserCheck, title:'Review before you book', desc:'Every caregiver profile shows their experience, services, availability and hourly rate. Take your time before sending a request.' },
  { icon: CreditCard, title:'Clear pricing, no surprises', desc:'Rates are shown upfront on every profile. Payments go through the platform so both family and caregiver have a record.' },
  { icon: Bell, title:'Updates the family can see', desc:'Caregivers log visit notes and the family sees them in the dashboard. No more guessing what happened during a care visit.' },
];

export default function HowItWorks() {
  return <>
    <section className="bg-brand-50 py-16 sm:py-24">
      <div className="page-shell">
        <span className="eyebrow">How SmartCare works</span>
        <h1 className="display mt-4 max-w-3xl text-4xl font-bold sm:text-5xl">From finding support to <em className="text-primary">a clear care plan.</em></h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">SmartCare handles the parts of care coordination that usually fall through the cracks — finding the right person, confirming details and keeping the family updated.</p>
      </div>
    </section>

    <section className="page-shell py-16 sm:py-24">
      <div className="grid gap-5 lg:grid-cols-4">
        {capabilities.map(({icon:Icon,title,desc})=>(
          <article key={title} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={20}/></div>
            <h2 className="mt-5 display text-xl font-bold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{desc}</p>
          </article>
        ))}
      </div>

      <div className="mt-16 grid items-center gap-12 rounded-2xl bg-brand-50 p-8 sm:p-12 lg:grid-cols-2">
        <div>
          <span className="eyebrow text-primary">Everything in one place</span>
          <h2 className="display mt-4 text-3xl font-bold">No more scattered phone calls.</h2>
          <p className="mt-4 leading-7 text-muted-foreground">SmartCare keeps caregiver profiles, booking details, payment records and care updates connected. The family sees the same information the caregiver does.</p>
        </div>
        <div className="space-y-3">
          {['Caregiver profiles with verified status','Booking requests with date and time','Payment history and receipts','Care visit notes and updates','Availability by day of week'].map((item)=>(
            <div key={item} className="flex items-center gap-3 rounded-xl bg-card p-4 text-sm font-semibold">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><ShieldCheck size={14}/></span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  </>;
}
