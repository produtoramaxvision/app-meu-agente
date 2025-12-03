import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SearchProvider } from "./contexts/SearchContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthLayout } from "./components/layout/AuthLayout";
import { AppLayout } from "./components/layout/AppLayout";
import { initPerformanceMonitoring } from "./lib/performance-monitor";
import { PageLoadingFallback } from "./components/PageLoadingFallback";

import { CheckoutPendingHandler } from "./components/CheckoutPendingHandler";

// ✅ Auth pages mantidas eager (primeira coisa que usuário não autenticado vê)
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// ✅ NotFound mantida eager (pequena e importante)
import NotFound from "./pages/NotFound";

// ✅ Páginas protegidas convertidas para lazy loading
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Reports = lazy(() => import("./pages/Reports"));
const Contas = lazy(() => import("./pages/Contas"));
const Goals = lazy(() => import("./pages/Goals"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Chat = lazy(() => import("./pages/Chat"));

// Inicializar monitoramento de performance
initPerformanceMonitoring();

const App = () => (
  <BrowserRouter 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <CheckoutPendingHandler />
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <SearchProvider>
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/auth/login" element={<AuthLayout><Login /></AuthLayout>} />
                  <Route path="/auth/signup" element={<AuthLayout><Signup /></AuthLayout>} />
                  <Route path="/auth/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
                  <Route path="/auth/reset-password" element={<AuthLayout><ResetPassword /></AuthLayout>} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <AppLayout><Dashboard /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/agenda"
                    element={
                      <ProtectedRoute>
                        <AppLayout><Agenda /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contas"
                    element={
                      <ProtectedRoute>
                        <AppLayout><Contas /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/metas"
                    element={
                      <ProtectedRoute>
                        <AppLayout><Goals /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tarefas"
                    element={
                      <ProtectedRoute>
                        <AppLayout><Tasks /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/relatorios"
                    element={
                      <ProtectedRoute>
                        <AppLayout><Reports /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notificacoes"
                    element={
                      <ProtectedRoute>
                        <AppLayout><Notifications /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/perfil"
                    element={
                      <ProtectedRoute>
                        <AppLayout><Profile /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <AppLayout><Chat /></AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </SearchProvider>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
);

export default App;