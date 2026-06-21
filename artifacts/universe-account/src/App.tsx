import { Suspense, lazy } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const AccountCenterPage = lazy(() => import("@/pages/AccountCenterPage"));
const SecurityCenterPage = lazy(() => import("@/pages/SecurityCenterPage"));
const DevicesPage = lazy(() => import("@/pages/DevicesPage"));
const SessionsPage = lazy(() => import("@/pages/SessionsPage"));
const RolesPage = lazy(() => import("@/pages/RolesPage"));
const EcosystemPage = lazy(() => import("@/pages/EcosystemPage"));
const IdentityPage = lazy(() => import("@/pages/IdentityPage"));
const DirectoryPage = lazy(() => import("@/pages/DirectoryPage"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050c1a]">
      <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={() => <Redirect to="/account-center" />} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/account-center" component={() => (
          <ProtectedRoute><AccountCenterPage /></ProtectedRoute>
        )} />
        <Route path="/security-center" component={() => (
          <ProtectedRoute><SecurityCenterPage /></ProtectedRoute>
        )} />
        <Route path="/devices" component={() => (
          <ProtectedRoute><DevicesPage /></ProtectedRoute>
        )} />
        <Route path="/sessions" component={() => (
          <ProtectedRoute><SessionsPage /></ProtectedRoute>
        )} />
        <Route path="/roles" component={() => (
          <ProtectedRoute><RolesPage /></ProtectedRoute>
        )} />
        <Route path="/ecosystem" component={() => (
          <ProtectedRoute><EcosystemPage /></ProtectedRoute>
        )} />
        <Route path="/identity" component={() => (
          <ProtectedRoute><IdentityPage /></ProtectedRoute>
        )} />
        <Route path="/directory" component={() => (
          <ProtectedRoute><DirectoryPage /></ProtectedRoute>
        )} />
        <Route component={() => <Redirect to="/account-center" />} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
