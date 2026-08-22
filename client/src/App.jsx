import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import PublicLayout from './components/layout/PublicLayout.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Spinner from './components/ui/Spinner.jsx';

// Public
const Home = lazy(() => import('./pages/public/Home.jsx'));
const HowItWorks = lazy(() => import('./pages/public/HowItWorks.jsx'));
const FindCaregiver = lazy(() => import('./pages/public/FindCaregiver.jsx'));
const CaregiverProfile = lazy(() => import('./pages/public/CaregiverProfile.jsx'));
const Services = lazy(() => import('./pages/public/Services.jsx'));
const Locations = lazy(() => import('./pages/public/Locations.jsx'));
const About = lazy(() => import('./pages/public/About.jsx'));
const Contact = lazy(() => import('./pages/public/Contact.jsx'));
const Login = lazy(() => import('./pages/public/Login.jsx'));
const Register = lazy(() => import('./pages/public/Register.jsx'));

// Patient
const PatientDashboard = lazy(() => import('./pages/patient/Dashboard.jsx'));
const BookingFlow = lazy(() => import('./pages/patient/BookingFlow.jsx'));
const PatientBookings = lazy(() => import('./pages/patient/Bookings.jsx'));
const PatientPayments = lazy(() => import('./pages/patient/Payments.jsx'));
const PatientProfile = lazy(() => import('./pages/patient/Profile.jsx'));

// Caregiver
const CaregiverDashboard = lazy(() => import('./pages/caregiver/Dashboard.jsx'));
const JobRequests = lazy(() => import('./pages/caregiver/JobRequests.jsx'));
const Availability = lazy(() => import('./pages/caregiver/Availability.jsx'));
const CaregiverReviews = lazy(() => import('./pages/caregiver/Reviews.jsx'));
const Earnings = lazy(() => import('./pages/caregiver/Earnings.jsx'));
const CaregiverProfileEdit = lazy(() => import('./pages/caregiver/Profile.jsx'));

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const VerifyCaregivers = lazy(() => import('./pages/admin/VerifyCaregivers.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/Users.jsx'));
const AdminBookings = lazy(() => import('./pages/admin/Bookings.jsx'));
const AdminPayments = lazy(() => import('./pages/admin/Payments.jsx'));
const Reports = lazy(() => import('./pages/admin/Reports.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/Settings.jsx'));

// Shared / misc
const BookingDetail = lazy(() => import('./pages/BookingDetail.jsx'));
const PaymentReturn = lazy(() => import('./pages/PaymentReturn.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function PageLoader() {
  return <Spinner label="Loading…" />;
}

export default function App() {
  return (
    <ToastProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* Public marketing + auth + browsing */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/find-caregivers" element={<FindCaregiver />} />
          <Route path="/caregivers/:id" element={<CaregiverProfile />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Payment gateway return (needs auth to verify, but no chrome) */}
        <Route
          path="/payment/return"
          element={<ProtectedRoute roles={['patient', 'admin']}><PaymentReturn /></ProtectedRoute>}
        />

        {/* Patient area */}
        <Route element={<ProtectedRoute roles={['patient']}><AppLayout /></ProtectedRoute>}>
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/patient/book/:caregiverId" element={<BookingFlow />} />
          <Route path="/patient/bookings" element={<PatientBookings />} />
          <Route path="/patient/bookings/:id" element={<BookingDetail />} />
          <Route path="/patient/payments" element={<PatientPayments />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
        </Route>

        {/* Caregiver area */}
        <Route element={<ProtectedRoute roles={['caregiver']}><AppLayout /></ProtectedRoute>}>
          <Route path="/caregiver" element={<CaregiverDashboard />} />
          <Route path="/caregiver/requests" element={<JobRequests />} />
          <Route path="/caregiver/requests/:id" element={<BookingDetail />} />
          <Route path="/caregiver/availability" element={<Availability />} />
          <Route path="/caregiver/reviews" element={<CaregiverReviews />} />
          <Route path="/caregiver/earnings" element={<Earnings />} />
          <Route path="/caregiver/profile" element={<CaregiverProfileEdit />} />
        </Route>

        {/* Admin area */}
        <Route element={<ProtectedRoute roles={['admin']}><AppLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/verify" element={<VerifyCaregivers />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/bookings/:id" element={<BookingDetail />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
    </ToastProvider>
  );
}
