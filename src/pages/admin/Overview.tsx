
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Calendar, Bookmark, CheckCircle2 } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState({
    eventCount: 0,
    departmentCount: 0,
    registrationCount: 0,
    verifiedRegistrationCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        
        // Fetch event count
        const { count: eventCount, error: eventError } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true });
        
        if (eventError) throw eventError;
        
        // Fetch department count
        const { count: departmentCount, error: deptError } = await supabase
          .from("departments")
          .select("*", { count: "exact", head: true });
        
        if (deptError) throw deptError;
        
        // Fetch registration count
        const { count: registrationCount, error: regError } = await supabase
          .from("registrations")
          .select("*", { count: "exact", head: true });
        
        if (regError) throw regError;
        
        // Fetch verified registration count
        const { count: verifiedCount, error: verifiedError } = await supabase
          .from("registrations")
          .select("*", { count: "exact", head: true })
          .eq("payment_status", "Verified");
        
        if (verifiedError) throw verifiedError;
        
        setStats({
          eventCount: eventCount || 0,
          departmentCount: departmentCount || 0,
          registrationCount: registrationCount || 0,
          verifiedRegistrationCount: verifiedCount || 0,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Dashboard Overview</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventCount}</div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Departments
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departmentCount}</div>
            <p className="text-xs text-muted-foreground">
              Participating in Sanchalana
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Registrations
            </CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registrationCount}</div>
            <p className="text-xs text-muted-foreground">
              Across all events
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Verified Registrations
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedRegistrationCount}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.verifiedRegistrationCount / stats.registrationCount) * 100 || 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="pt-4">
        <h3 className="text-lg font-semibold mb-4">Welcome to the Admin Dashboard</h3>
        <p className="text-muted-foreground">
          This dashboard provides tools to manage events, departments, and registrations for Sanchalana 2025.
          Use the tabs on the left to navigate between different management sections.
        </p>
      </div>
    </div>
  );
}
