import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RegistrationWithDetails, Event, Department, Admin } from "@/types";
import { Loader2, Check, X, Eye, Search, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface RegistrationsManagementProps {
  adminDetails: Admin | null;
}

export default function RegistrationsManagement({ adminDetails }: RegistrationsManagementProps) {
  const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [viewingTeamMembers, setViewingTeamMembers] = useState<RegistrationWithDetails | null>(null);
  
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    
    fetchData();
  }, [isAdmin, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let eventQuery = supabase.from("events").select("*");
      
      if (adminDetails?.role === "department_admin" && adminDetails.department_id) {
        eventQuery = eventQuery.eq('department_id', adminDetails.department_id);
      } else if (adminDetails?.role === "event_admin" && adminDetails.event_id) {
        eventQuery = eventQuery.eq('id', adminDetails.event_id);
      }
      
      const { data: eventData, error: eventError } = await eventQuery;
      
      if (eventError) throw eventError;
      setEvents(eventData || []);
      
      const { data: deptData, error: deptError } = await supabase
        .from("departments")
        .select("*");
      
      if (deptError) throw deptError;
      setDepartments(deptData || []);
      
      let registrationQuery = supabase.from("registrations").select("*");
      
      if (adminDetails?.role === "department_admin" && adminDetails.department_id) {
        const deptEventIds = eventData?.filter(e => e.department_id === adminDetails.department_id)
          .map(e => e.id) || [];
        
        if (deptEventIds.length > 0) {
          registrationQuery = registrationQuery.in('event_id', deptEventIds);
        } else {
          setRegistrations([]);
          setIsLoading(false);
          return;
        }
      } else if (adminDetails?.role === "event_admin" && adminDetails.event_id) {
        registrationQuery = registrationQuery.eq('event_id', adminDetails.event_id);
      }
      
      const { data: regData, error: regError } = await registrationQuery
        .order("created_at", { ascending: false });
      
      if (regError) throw regError;
      
      const enhancedRegistrations: RegistrationWithDetails[] = [];
      
      for (const reg of regData || []) {
        const event = eventData?.find(e => e.id === reg.event_id);
        const department = event ? deptData?.find(d => d.id === event.department_id) : undefined;
        
        let teamMembers = [];
        try {
          if (typeof reg.team_members === 'string') {
            teamMembers = JSON.parse(reg.team_members);
          } else if (Array.isArray(reg.team_members)) {
            teamMembers = reg.team_members;
          } else if (reg.team_members && typeof reg.team_members === 'object') {
            teamMembers = [reg.team_members];
          }
        } catch (e) {
          console.error("Error parsing team members:", e);
          teamMembers = [];
        }
        
        if (event) {
          enhancedRegistrations.push({
            ...reg,
            event: event,
            department,
            team_members: teamMembers.map((member: any) => ({
              name: member.name || '',
              usn: member.usn || '',
              phone: member.phone || ''
            }))
          });
        }
      }
      
      setRegistrations(enhancedRegistrations);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error fetching registrations",
        description: "Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyRegistration = async (registration: RegistrationWithDetails) => {
    if (!canModifyRegistration(registration)) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You don't have permission to verify this registration."
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from("registrations")
        .update({ payment_status: "Verified" })
        .eq("id", registration.id);
      
      if (error) throw error;
      
      toast({
        title: "Payment verified",
        description: "Registration payment has been verified successfully."
      });
      
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === registration.id 
            ? { ...reg, payment_status: "Verified" } 
            : reg
        )
      );
      
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      toast({
        variant: "destructive",
        title: "Error verifying payment",
        description: error?.message || "Please try again later."
      });
    }
  };

  const handleRejectRegistration = async (registration: RegistrationWithDetails) => {
    if (!canModifyRegistration(registration)) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You don't have permission to reject this registration."
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from("registrations")
        .update({ payment_status: "Rejected" })
        .eq("id", registration.id);
      
      if (error) throw error;
      
      toast({
        title: "Payment rejected",
        description: "Registration payment has been rejected."
      });
      
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === registration.id 
            ? { ...reg, payment_status: "Rejected" } 
            : reg
        )
      );
      
    } catch (error: any) {
      console.error("Error rejecting payment:", error);
      toast({
        variant: "destructive",
        title: "Error rejecting payment",
        description: error?.message || "Please try again later."
      });
    }
  };

  const handleResetPaymentStatus = async (registration: RegistrationWithDetails) => {
    if (!canModifyRegistration(registration)) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You don't have permission to reset this registration."
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from("registrations")
        .update({ payment_status: "Pending" })
        .eq("id", registration.id);
      
      if (error) throw error;
      
      toast({
        title: "Payment status reset",
        description: "Registration payment status has been reset to pending."
      });
      
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === registration.id 
            ? { ...reg, payment_status: "Pending" } 
            : reg
        )
      );
      
    } catch (error: any) {
      console.error("Error resetting payment status:", error);
      toast({
        variant: "destructive",
        title: "Error resetting status",
        description: error?.message || "Please try again later."
      });
    }
  };

  const canModifyRegistration = (registration: RegistrationWithDetails): boolean => {
    if (adminDetails?.role === "main_admin") {
      return true;
    }
    
    if (adminDetails?.role === "department_admin" && registration.event?.department_id === adminDetails.department_id) {
      return true;
    }
    
    if (adminDetails?.role === "event_admin" && registration.event_id === adminDetails.event_id) {
      return true;
    }
    
    return false;
  };

  const getFilteredEvents = () => {
    if (departmentFilter === "all") {
      return events;
    }
    return events.filter(event => event.department_id === departmentFilter);
  };

  const getFilteredRegistrations = () => {
    return registrations.filter(reg => {
      if (statusFilter !== "all" && reg.payment_status.toLowerCase() !== statusFilter) {
        return false;
      }
      
      if (departmentFilter !== "all" && reg.event.department_id !== departmentFilter) {
        return false;
      }
      
      if (eventFilter !== "all" && reg.event_id !== eventFilter) {
        return false;
      }
      
      if (searchQuery) {
        const eventTitle = reg.event.title.toLowerCase();
        const teamId = reg.team_id.toLowerCase();
        const eventDepartment = reg.department?.name.toLowerCase() || "";
        const teamMemberNames = reg.team_members.map(m => m.name.toLowerCase()).join(" ");
        const teamMemberUSNs = reg.team_members.map(m => m.usn.toLowerCase()).join(" ");
        const searchLower = searchQuery.toLowerCase();
        
        return (
          eventTitle.includes(searchLower) || 
          teamId.includes(searchLower) || 
          eventDepartment.includes(searchLower) ||
          teamMemberNames.includes(searchLower) ||
          teamMemberUSNs.includes(searchLower)
        );
      }
      
      return true;
    });
  };

  const filteredRegistrations = getFilteredRegistrations();

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "verified":
        return <Badge className="bg-green-500">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getTeamLeaderPhone = (registration: RegistrationWithDetails) => {
    if (registration.team_members && registration.team_members.length > 0) {
      return registration.team_members[0].phone || "N/A";
    }
    return "N/A";
  };

  const getAvailableDepartments = () => {
    if (adminDetails?.role === "department_admin" && adminDetails.department_id) {
      return departments.filter(dept => dept.id === adminDetails.department_id);
    }
    if (adminDetails?.role === "event_admin" && adminDetails.event_id) {
      const event = events.find(e => e.id === adminDetails.event_id);
      if (event) {
        return departments.filter(dept => dept.id === event.department_id);
      }
      return [];
    }
    return departments;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Registrations Management</h2>
        <p className="text-muted-foreground">
          Manage event registrations and verify payments
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row flex-wrap gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search registrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-[250px] pl-8"
          />
        </div>
        
        <Select 
          value={statusFilter} 
          onValueChange={(value: "all" | "pending" | "verified" | "rejected") => setStatusFilter(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        
        <Select 
          value={departmentFilter} 
          onValueChange={(value) => {
            setDepartmentFilter(value);
            setEventFilter("all");
          }}
          disabled={adminDetails?.role !== "main_admin"}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {getAvailableDepartments().map(dept => (
              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={eventFilter} 
          onValueChange={(value) => setEventFilter(value)}
          disabled={adminDetails?.role === "event_admin"}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {getFilteredEvents().map(event => (
              <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={fetchData} className="w-full sm:w-[120px]">
          <Loader2 className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Event</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="hidden sm:table-cell">Team ID</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="hidden lg:table-cell">Team Leader Phone</TableHead>
              <TableHead className="hidden lg:table-cell">Payment Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegistrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No registrations found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredRegistrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">
                    <div className="sm:hidden">
                      <div className="font-medium">{registration.event.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {registration.department?.name || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Team ID: {registration.team_id}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Phone: {getTeamLeaderPhone(registration)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Payment: {registration.payment_method}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Date: {new Date(registration.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="hidden sm:block">{registration.event.title}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {registration.department?.name || "Unknown"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{registration.team_id}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setViewingTeamMembers(registration)}
                      className="h-8"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-primary" />
                      {getTeamLeaderPhone(registration)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{registration.payment_method}</TableCell>
                  <TableCell>{getPaymentStatusBadge(registration.payment_status)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(registration.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {canModifyRegistration(registration) && (
                      <div className="flex gap-1">
                        {registration.payment_status.toLowerCase() !== 'verified' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleVerifyRegistration(registration)}
                            className="h-8 w-8"
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        {registration.payment_status.toLowerCase() !== 'rejected' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRejectRegistration(registration)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        {registration.payment_status.toLowerCase() !== 'pending' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleResetPaymentStatus(registration)}
                            className="h-8 w-8"
                          >
                            <Loader2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Showing {filteredRegistrations.length} of {registrations.length} registrations
      </div>
      
      <Dialog open={!!viewingTeamMembers} onOpenChange={() => setViewingTeamMembers(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Team Members</DialogTitle>
            <DialogDescription>
              {viewingTeamMembers?.team_id} - {viewingTeamMembers?.event.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {viewingTeamMembers?.team_members.map((member, index) => (
              <div key={index} className="p-4 border rounded-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{member.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">USN</p>
                    <p className="font-medium">{member.usn}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{member.phone}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}