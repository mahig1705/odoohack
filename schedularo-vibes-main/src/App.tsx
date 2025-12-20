import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";

// Customer pages
import CustomerDashboard from "./pages/customer/Dashboard";
import CustomerDiscover from "./pages/customer/Discover";
import CustomerBookings from "./pages/customer/Bookings";
import CustomerProfile from "./pages/customer/Profile";
import BookAppointment from "@/pages/customer/BookAppointment";

import CustomerBookAppointment from "./pages/customer/BookAppointment";

// Organizer pages
import OrganizerAppointments from "./pages/organizer/Appointments";
import OrganizerAppointmentForm from "./pages/organizer/AppointmentForm";
import OrganizerMeetings from "./pages/organizer/Meetings";
import OrganizerResources from "./pages/organizer/Resources";
import OrganizerUsers from "./pages/organizer/Users";
import OrganizerReporting from "./pages/organizer/Reporting";
import OrganizerSettings from "./pages/organizer/Settings";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Customer routes */}
            <Route path="/customer/dashboard" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerDashboard /></ProtectedRoute>} />
            <Route path="/customer/discover" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerDiscover /></ProtectedRoute>} />
            <Route
              path="/customer/book/:appointmentTypeId"
              element={<ProtectedRoute allowedRoles={["customer"]}><BookAppointment /></ProtectedRoute>}
            />
            <Route path="/customer/bookings" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerBookings /></ProtectedRoute>} />
            <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerProfile /></ProtectedRoute>} />

            {/* Organizer routes */}
            <Route path="/organizer/appointments" element={<ProtectedRoute allowedRoles={["organizer"]}><OrganizerAppointments /></ProtectedRoute>} />
            <Route path="/organizer/appointments/new" element={<ProtectedRoute allowedRoles={["organizer"]}><OrganizerAppointmentForm /></ProtectedRoute>} />
            <Route path="/organizer/appointments/:id" element={<ProtectedRoute allowedRoles={["organizer"]}><OrganizerAppointmentForm /></ProtectedRoute>} />
            <Route path="/organizer/appointments/:id/meetings" element={<ProtectedRoute allowedRoles={["organizer"]}><OrganizerMeetings /></ProtectedRoute>} />
            <Route path="/organizer/resources" element={<ProtectedRoute allowedRoles={["organizer"]}><OrganizerResources /></ProtectedRoute>} />
            <Route path="/organizer/users" element={<ProtectedRoute allowedRoles={["organizer"]}><OrganizerUsers /></ProtectedRoute>} />
            <Route path="/organizer/reporting" element={<ProtectedRoute allowedRoles={["organizer"]}><OrganizerReporting /></ProtectedRoute>} />
            <Route path="/organizer/settings" element={<ProtectedRoute allowedRoles={["organizer"]}><OrganizerSettings /></ProtectedRoute>} />
            <Route path="/organizer/dashboard" element={<ProtectedRoute allowedRoles={["organizer"]}><OrganizerAppointments /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />

            {/* Legacy route */}
            <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
