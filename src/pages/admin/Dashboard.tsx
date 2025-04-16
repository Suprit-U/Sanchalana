import { useState, useEffect } from "react";
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

import AdminOverview from "./Overview";
import EventsManagement from "./events/EventsManagement";
import DepartmentsManagement from "./departments/DepartmentsManagement";
import RegistrationsManagement from "./registrations/RegistrationsManagement";
import AdminUserManagement from "./admins/AdminUserManagement";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Shield,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isLoading, isAdmin, adminRole, adminDetails } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    } else if (!isLoading && !isAdmin) {
      navigate("/");
    }
    
    // Update active tab based on current path
    const path = location.pathname.split("/").pop() || "overview";
    setActiveTab(path === "admin" ? "overview" : path);
  }, [user, isLoading, navigate, isAdmin, location]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" />;
  }
  
  // Check access rights based on admin role
  const canAccessDepartments = adminRole === "main_admin";
  const canAccessAdminUsers = adminRole === "main_admin" || adminRole === "department_admin";
  const canAccessEvents = adminRole === "main_admin" || adminRole === "department_admin" || adminRole === "event_admin";
  
  // Sidebar content component to avoid duplication
  const SidebarItems = () => (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={activeTab === "overview"}
            onClick={() => {
              setActiveTab("overview");
              navigate("/admin");
            }}
          >
            <LayoutDashboard className="mr-2 h-5 w-5" />
            <span>Overview</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {canAccessEvents && (
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeTab === "events"}
              onClick={() => {
                setActiveTab("events");
                navigate("/admin/events");
              }}
            >
              <Calendar className="mr-2 h-5 w-5" />
              <span>Events</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {canAccessDepartments && (
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeTab === "departments"}
              onClick={() => {
                setActiveTab("departments");
                navigate("/admin/departments");
              }}
            >
              <Users className="mr-2 h-5 w-5" />
              <span>Departments</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={activeTab === "registrations"}
            onClick={() => {
              setActiveTab("registrations");
              navigate("/admin/registrations");
            }}
          >
            <FileText className="mr-2 h-5 w-5" />
            <span>Registrations</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {canAccessAdminUsers && (
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeTab === "admins"}
              onClick={() => {
                setActiveTab("admins");
                navigate("/admin/admins");
              }}
            >
              <Shield className="mr-2 h-5 w-5" />
              <span>Admin Users</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </>
  );
  
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar variant="inset">
            <SidebarHeader>
              <div className="flex items-center px-2">
                <h2 className="text-xl font-bold text-primary">Admin Dashboard</h2>
                <SidebarTrigger className="ml-auto" />
              </div>
            </SidebarHeader>

            <SidebarContent className="pt-14">
              <SidebarItems />
            </SidebarContent>

            <SidebarFooter>
              <Separator className="my-4" />
              <div className="px-2 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Website
                  </Link>
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>
        </div>

        {/* Mobile Sidebar - Only visible on mobile when toggled */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-background md:hidden">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold text-primary">Admin Dashboard</h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                <SidebarItems />
              </div>
              
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link to="/">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Website
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        <SidebarInset>
          {/* Mobile Header with Sidebar Toggle Button */}
          <div className="sticky top-0 z-10 w-full md:hidden bg-background/80 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-semibold">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="container p-6">
            <Routes>
              <Route index element={<AdminOverview />} />
              {canAccessEvents && <Route path="events" element={<EventsManagement adminDetails={adminDetails} />} />}
              {canAccessDepartments && <Route path="departments" element={<DepartmentsManagement />} />}
              <Route path="registrations" element={<RegistrationsManagement adminDetails={adminDetails} />} />
              {canAccessAdminUsers && <Route path="admins" element={<AdminUserManagement adminDetails={adminDetails} />} />}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}