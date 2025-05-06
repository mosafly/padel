import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { SupabaseProvider } from "./contexts/SupabaseContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Layouts
import ClientLayout from "./layouts/ClientLayout";
import AdminLayout from "./layouts/AdminLayout";

// Client Pages
import HomePage from "./pages/client/HomePage";
import ReservationPage from "./pages/client/ReservationPage";
import MyReservationsPage from "./pages/client/MyReservationsPage";
import PaymentSimulationPage from "./pages/client/PaymentSimulationPage";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import CourtsManagement from "./pages/admin/CourtsManagement";
import ReservationsManagement from "./pages/admin/ReservationsManagement";
import FinancialTracking from "./pages/admin/FinancialTracking";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Protected Route Component
const ProtectedRoute = ({
  children,
  requiredRole = null,
}: {
  children: React.ReactNode;
  requiredRole?: "admin" | "client" | null;
}) => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary)]"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  console.log("ProtectedRoute checking roles:", {
    user,
    userRole,
    requiredRole,
  });

  if (requiredRole && !userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary)]"></div>
          <p className="mt-2">Chargement des permissions...</p>
        </div>
      </div>
    );
  }

  if (requiredRole && userRole !== requiredRole) {
    console.log("Role mismatch, redirecting to home");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <SupabaseProvider>
        <AuthProvider>
          <Router>
            <Toaster position="top-center" />
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Client Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <ClientLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<HomePage />} />
                <Route
                  path="reservation/:courtId?"
                  element={<ReservationPage />}
                />
                <Route
                  path="my-reservations"
                  element={<MyReservationsPage />}
                />
                <Route
                  path="payment-simulation"
                  element={<PaymentSimulationPage />}
                />
              </Route>

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="courts" element={<CourtsManagement />} />
                <Route
                  path="reservations"
                  element={<ReservationsManagement />}
                />
                <Route path="financial" element={<FinancialTracking />} />
              </Route>

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </SupabaseProvider>
    </ErrorBoundary>
  );
}

export default App;
