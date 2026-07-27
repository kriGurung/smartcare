import { Link } from 'react-router-dom';
import {
  Search, UserCheck, CalendarCheck, CreditCard, ClipboardList, Star,
  ShieldCheck, FileCheck2, BadgeCheck, Wallet, ArrowRight,
} from 'lucide-react';
import Button from '../../components/ui/Button.jsx';

const PATIENT = [
  { icon: Search, title: 'Search verified caregivers', body: 'Filter by service, city, home vs hospital, price and rating. Only verified caregivers ever appear.' },
  { icon: UserCheck, title: 'Compare profiles', body: 'Review experience, languages, a transparent verification checklist and genuine patient reviews.' },
  { icon: CalendarCheck, title: 'Book a visit', body: 'Choose the service, date, time and location. See the total price before you confirm.' },
  { icon: CreditCard, title: 'Pay securely', body: 'Pay with eSewa, Khalti, bank transfer, or cash on visit. Every transaction is tracked.' },
  { icon: ClipboardList, title: 'Follow the visit', body: 'Your caregiver logs tasks completed and observations so you always know how things went.' },
  { icon: Star, title: 'Leave a review', body: 'After a completed visit, rate punctuality, care quality and communication to help other families.' },
];

const CAREGIVER = [
  { icon: FileCheck2, title: 'Create your profile', body: 'Add your experience, services offered, hourly rate and the areas you serve.' },
  { icon: ShieldCheck, title: 'Get verified', body: 'Upload your citizenship, training certificate and police clearance for admin review.' },
  { icon: BadgeCheck, title: 'Appear in search', body: 'Once verified, you show up in patient searches and start receiving booking requests.' },
  { icon: Wallet, title: 'Work & earn', body: 'Accept requests, log care visits, and track your earnings — paid transparently, minus a small platform fee.' },
];

export default function HowItWorks() {
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50/70 to-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">How SmartCare works</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-soft">
            A transparent, trustworthy way to give and receive care. Here's what to expect — whether you're
            booking a caregiver or becoming one.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">For families & patients</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">Book care in six steps</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PATIENT.map((s, i) => (
            <div key={s.title} className="card-base p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><s.icon size={24} /></span>
                <span className="text-3xl font-bold text-brand-100">{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Button as={Link} to="/find-caregivers" icon={Search}>Find a caregiver</Button>
        </div>
      </section>

      <section className="bg-surface-muted">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-care-50 px-3 py-1 text-sm font-semibold text-care-700">For caregivers</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">Start earning as a verified caregiver</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CAREGIVER.map((s, i) => (
              <div key={s.title} className="card-base p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-care-50 text-care-600"><s.icon size={24} /></span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button as={Link} to="/register" variant="care" icon={ArrowRight}>Become a caregiver</Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <ShieldCheck size={40} className="mx-auto text-brand-600" />
        <h2 className="mt-4 text-2xl font-bold text-ink">Verification you can trust</h2>
        <p className="mx-auto mt-3 max-w-2xl text-ink-soft">
          Before any caregiver can accept bookings, our admin team reviews their identity, training and police
          clearance. Verified badges and per-document checklists mean you always know who you're inviting into
          your home or hospital room.
        </p>
      </section>
    </div>
  );
}
