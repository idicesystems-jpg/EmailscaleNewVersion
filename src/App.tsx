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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ImpersonationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          {/* <Route path="/" element={<Navigate to="/dashboard" replace />} /> */}
          <Route path="/" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/inbox-ordering" element={<InboxOrdering />} />
          <Route path="/dashboard/warmup" element={<EmailWarmup />} />
          <Route path="/dashboard/placement-test" element={<PlacementTest />} />
          <Route path="/dashboard/verification" element={<EmailVerification />} />
          <Route path="/dashboard/integrations" element={<Integrations />} />
          <Route path="/dashboard/support" element={<Support />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/domains" element={<AdminDomains />} />
          <Route path="/admin/inboxes" element={<AdminInboxes />} />
          <Route path="/admin/warmups" element={<AdminWarmups />} />
          <Route path="/admin/server-monitoring" element={<AdminServerMonitoring />} />
          <Route path="/admin/support" element={<AdminSupport />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </ImpersonationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
