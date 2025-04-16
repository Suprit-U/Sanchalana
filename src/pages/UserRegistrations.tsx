
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RegistrationWithDetails } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";

export default function UserRegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate("/auth");
      return;
    }

    async function fetchRegistrations() {
      try {
        setIsLoading(true);
        
        // Fetch user registrations
        const { data: registrationsData, error: registrationsError } = await supabase
          .from("registrations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        
        if (registrationsError) throw registrationsError;
        
        // If no registrations, return
        if (!registrationsData || registrationsData.length === 0) {
          setRegistrations([]);
          return;
        }
        
        // Fetch events for each registration
        const registrationsWithDetails: RegistrationWithDetails[] = [];
        
        for (const reg of registrationsData) {
          // Fetch event details
          const { data: eventData, error: eventError } = await supabase
            .from("events")
            .select("*")
            .eq("id", reg.event_id)
            .single();
          
          if (eventError) {
            console.error("Error fetching event details:", eventError);
            continue;
          }
          
          // Fetch department details
          let departmentData = null;
          if (eventData?.department_id) {
            const { data: deptData, error: deptError } = await supabase
              .from("departments")
              .select("*")
              .eq("id", eventData.department_id)
              .single();
            
            if (!deptError) {
              departmentData = deptData;
            }
          }
          
          // Convert team_members from JSON to properly typed array if needed
          let typedTeamMembers;
          if (typeof reg.team_members === 'string') {
            try {
              typedTeamMembers = JSON.parse(reg.team_members);
            } catch (e) {
              console.error("Error parsing team members:", e);
              typedTeamMembers = [];
            }
          } else {
            typedTeamMembers = reg.team_members as any[];
          }
          
          // Create properly typed registration object - made compatible with updated type
          const typedRegistration: RegistrationWithDetails = {
            ...reg,
            team_members: typedTeamMembers,
            event: eventData,
            department: departmentData || undefined,
            payment_status: reg.payment_status
          };
          
          registrationsWithDetails.push(typedRegistration);
        }
        
        setRegistrations(registrationsWithDetails);
        
      } catch (error) {
        console.error("Error fetching registrations:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchRegistrations();
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <div className="container py-16 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-center mb-2">No Registrations Found</h1>
        <p className="text-muted-foreground text-center">You have not registered for any events yet.</p>
        <Button onClick={() => navigate("/")}>Explore Events</Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">My Registrations</h1>
      <Card>
        <CardHeader>
          <CardTitle>Event Registrations</CardTitle>
          <CardDescription>
            Here is a list of all the events you have registered for.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Event</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Team ID</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Payment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">{registration.event.title}</TableCell>
                  <TableCell>{registration.department?.name || "N/A"}</TableCell>
                  <TableCell>{registration.team_id}</TableCell>
                  <TableCell>{registration.payment_method}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={registration.payment_status === "Verified" ? "success" : "secondary"}
                    >
                      {registration.payment_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Total registrations: {registrations.length}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
