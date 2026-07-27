import {
  LayoutDashboard, Search, CalendarClock, CreditCard, UserCog,
  Inbox, CalendarRange, Star, Wallet, ShieldCheck, Users, Receipt,
  BarChart3, Settings,
} from 'lucide-react';

// `primary: true` items also appear in the mobile bottom nav (max 5 shown).
export const NAV = {
  patient: [
    { to: '/patient', label: 'Dashboard', icon: LayoutDashboard, end: true, primary: true },
    { to: '/find-caregivers', label: 'Find care', icon: Search, primary: true },
    { to: '/patient/bookings', label: 'My bookings', icon: CalendarClock, primary: true },
    { to: '/patient/payments', label: 'Payments', icon: CreditCard, primary: true },
    { to: '/patient/profile', label: 'Profile', icon: UserCog, primary: true },
  ],
  caregiver: [
    { to: '/caregiver', label: 'Dashboard', icon: LayoutDashboard, end: true, primary: true },
    { to: '/caregiver/requests', label: 'Job requests', icon: Inbox, primary: true },
    { to: '/caregiver/availability', label: 'Availability', icon: CalendarRange, primary: true },
    { to: '/caregiver/earnings', label: 'Earnings', icon: Wallet, primary: true },
    { to: '/caregiver/reviews', label: 'Reviews', icon: Star },
    { to: '/caregiver/profile', label: 'Profile', icon: UserCog, primary: true },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, primary: true },
    { to: '/admin/verify', label: 'Verifications', icon: ShieldCheck, primary: true },
    { to: '/admin/users', label: 'Users', icon: Users, primary: true },
    { to: '/admin/bookings', label: 'Bookings', icon: CalendarClock, primary: true },
    { to: '/admin/payments', label: 'Payments', icon: Receipt },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3, primary: true },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
};

export const ROLE_HOME = { patient: '/patient', caregiver: '/caregiver', admin: '/admin' };
export const ROLE_LABEL = { patient: 'Patient', caregiver: 'Caregiver', admin: 'Administrator' };
