import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ImpersonationProvider } from "@/hooks/useImpersonation";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import InboxOrdering from "./pages/InboxOrdering";
import EmailWarmup from "./pages/EmailWarmup";
import PlacementTest from "./pages/PlacementTest";
import EmailVerification from "./pages/EmailVerification";
import Integrations from "./pages/Integrations";
import Support from "./pages/Support";
import Settings from "./pages/Settings";

import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminWarmups from "./pages/admin/AdminWarmups";
import AdminDomains from "./pages/admin/AdminDomains";
import AdminInboxes from "./pages/admin/AdminInboxes";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminServerMonitoring from "./pages/admin/AdminServerMonitoring";
import AdminSettings from "./pages/admin/AdminSettings";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminIntegrations from "./pages/admin/AdminIntegrations";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ImpersonationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/" element={<Auth />} />

            {/* User Routes (role_id !== 1) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={[2,1]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/inbox-ordering"
              element={
                <ProtectedRoute allowedRoles={[2,1]}>
                  <InboxOrdering />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/warmup"
              element={
                <ProtectedRoute allowedRoles={[2,1]}>
                  <EmailWarmup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/placement-test"
              element={
                <ProtectedRoute allowedRoles={[2,1]}>
                  <PlacementTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/verification"
              element={
                <ProtectedRoute allowedRoles={[2,1]}>
                  <EmailVerification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/integrations"
              element={
                <ProtectedRoute allowedRoles={[2,1]}>
                  <Integrations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/support"
              element={
                <ProtectedRoute allowedRoles={[2,1]}>
                  <Support />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute allowedRoles={[2,1]}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes (role_id === 1) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={[1]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={[1]}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/domains"
              element={
                <ProtectedRoute allowedRoles={[1]}>
                  <AdminDomains />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inboxes"
              element={
                <ProtectedRoute allowedRoles={[1]}>
                  <AdminInboxes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/warmups"
              element={
                <ProtectedRoute allowedRoles={[1]}>
                  <AdminWarmups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/integrations"
              element={
                <ProtectedRoute allowedRoles={[1]}>
                  <AdminIntegrations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/server-monitoring"
              element={
                <ProtectedRoute allowedRoles={[1]}>
                  <AdminServerMonitoring />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/support"
              element={
                <ProtectedRoute allowedRoles={[1]}>
                  <AdminSupport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={[1]}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ImpersonationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
