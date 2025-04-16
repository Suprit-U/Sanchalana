import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";

import { Layout } from "@/components/Layout";
import HomePage from "@/pages/Index";
import AuthPage from "@/pages/Auth";
import DepartmentPage from "@/pages/Department";
import EventDetailPage from "@/pages/EventDetail";
import SearchPage from "@/pages/Search";
import RegistrationPage from "@/pages/Registration";
import ProfilePage from "@/pages/Profile";
import UserRegistrationsPage from "@/pages/UserRegistrations";
import AdminDashboard from "@/pages/admin/Dashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="system">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="auth" element={<AuthPage />} />
                <Route path="departments/:id" element={<DepartmentPage />} />
                <Route path="events/:id" element={<EventDetailPage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="register/:id" element={<RegistrationPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="registrations" element={<UserRegistrationsPage />} />
                <Route path="admin/*" element={<AdminDashboard />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
