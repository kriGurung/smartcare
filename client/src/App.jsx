import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Public
import Home from './pages/public/Home.jsx';
import HowItWorks from './pages/public/HowItWorks.jsx';
import FindCaregiver from './pages/public/FindCaregiver.jsx';
import CaregiverProfile from './pages/public/CaregiverProfile.jsx';
import Login from './pages/public/Login.jsx';
import Register from './pages/public/Register.jsx';

// Patient
import PatientDashboard from './pages/patient/Dashboard.jsx';
import BookingFlow from './pages/patient/BookingFlow.jsx';
import PatientBookings from './pages/patient/Bookings.jsx';
import PatientPayments from './pages/patient/Payments.jsx';
import PatientProfile from './pages/patient/Profile.jsx';

// Caregiver
import CaregiverDashboard from './pages/caregiver/Dashboard.jsx';
import JobRequests from './pages/caregiver/JobRequests.jsx';
import Availability from './pages/caregiver/Availability.jsx';
import CaregiverReviews from './pages/caregiver/Reviews.jsx';
import Earnings from './pages/caregiver/Earnings.jsx';
import CaregiverProfileEdit from './pages/caregiver/Profile.jsx';

// Admin
import AdminDashboard from './pages/admin/Dashboard.jsx';
import VerifyCaregivers from './pages/admin/VerifyCaregivers.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminBookings from './pages/admin/Bookings.jsx';
import AdminPayments from './pages/admin/Payments.jsx';
import Reports from './pages/admin/Reports.jsx';
import AdminSettings from './pages/admin/Settings.jsx';

// Shared / misc
import BookingDetail from './pages/BookingDetail.jsx';
import PaymentReturn from './pages/PaymentReturn.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public marketing + auth + browsing */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/find-caregivers" element={<FindCaregiver />} />
        <Route path="/caregivers/:id" element={<CaregiverProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

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
  );
}
