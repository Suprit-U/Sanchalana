import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Admin, Department, Event } from "@/types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Building2, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminUserManagement({ adminDetails }: { adminDetails?: Admin }) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("event_admin");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    fetchAdmins();
    fetchUsers();
    fetchDepartments();
    fetchEvents();
  }, [adminDetails]);

  useEffect(() => {
    if (selectedDepartment && events.length > 0) {
      const filtered = events.filter((event) => event.department_id === selectedDepartment);
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents([]);
    }
    setSelectedEvent("");
  }, [selectedDepartment, events]);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("admins").select("*");
      if (adminDetails?.role === "department_admin") {
        query = query.eq("department_id", adminDetails.department_id);
      } else if (adminDetails?.role === "event_admin") {
        query = query.eq("event_id", adminDetails.event_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setAdmins(data || []);
    } catch (error: any) {
      console.error("Error fetching admins:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch admin users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc("get_users_with_emails");
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch departments",
        variant: "destructive",
      });
    }
  };

  const fetchEvents = async () => {
    try {
      let query = supabase.from("events").select("*").order("title");
      if (adminDetails?.role === "department_admin" && adminDetails.department_id) {
        query = query.eq("department_id", adminDetails.department_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch events",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAdmin = async () => {
    try {
      if (!selectedUserId) {
        toast({
          title: "Error",
          description: "Please select a user",
          variant: "destructive",
        });
        return;
      }
      if (selectedRole === "department_admin" && !selectedDepartment) {
        toast({
          title: "Error",
          description: "Please select a department for the department admin",
          variant: "destructive",
        });
        return;
      }
      if (selectedRole === "event_admin" && !selectedEvent) {
        toast({
          title: "Error",
          description: "Please select an event for the event admin",
          variant: "destructive",
        });
        return;
      }
      const allowedRoles =
        adminDetails?.role === "main_admin"
          ? ["main_admin", "department_admin", "event_admin"]
          : adminDetails?.role === "department_admin"
          ? ["event_admin"]
          : [];
      if (!allowedRoles.includes(selectedRole)) {
        toast({
          title: "Error",
          description: "You do not have permission to assign this role",
          variant: "destructive",
        });
        return;
      }
      const adminData = {
        id: selectedUserId,
        username: selectedUserEmail || "",
        role: selectedRole as "main_admin" | "department_admin" | "event_admin",
        department_id:
          selectedRole === "department_admin"
            ? selectedDepartment
            : selectedRole === "event_admin"
            ? events.find((e) => e.id === selectedEvent)?.department_id || null
            : null,
        event_id: selectedRole === "event_admin" ? selectedEvent : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("admins")
        .upsert(adminData, { onConflict: "id" });
      if (error) throw error;
      fetchAdmins();
      setSelectedUserId(null);
      setSelectedUserEmail(null);
      setSelectedRole("event_admin");
      setSelectedDepartment("");
      setSelectedEvent("");
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Admin user created successfully",
      });
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      const { error } = await supabase.from("admins").delete().eq("id", adminId);
      if (error) throw error;
      fetchAdmins();
      toast({
        title: "Success",
        description: "Admin user deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete admin user",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value as "main_admin" | "department_admin" | "event_admin");
    if (value !== "department_admin") {
      setSelectedDepartment("");
    }
    if (value !== "event_admin") {
      setSelectedEvent("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getDepartmentName = (departmentId: string | null | undefined) => {
    if (!departmentId) return "N/A";
    const department = departments.find((d) => d.id === departmentId);
    return department ? department.name : "Unknown";
  };

  const getEventName = (eventId: string | null | undefined) => {
    if (!eventId) return "N/A";
    const event = events.find((e) => e.id === eventId);
    return event ? event.title : "Unknown";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Admin User Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Admin User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Admin User</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">
                  User Email
                </label>
                <Input
                  type="email"
                  id="email"
                  placeholder="Search for a user by email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <Button
                      key={user.id}
                      variant="ghost"
                      className={`w-full justify-start text-left ${
                        selectedUserId === user.id ? "bg-secondary" : ""
                      }`}
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setSelectedUserEmail(user.email);
                        setSearchQuery(user.email);
                      }}
                    >
                      {user.email}
                    </Button>
                  ))
                ) : (
                  <p className="p-2 text-sm text-muted-foreground">No users found</p>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="role" className="text-sm font-medium">
                  Role
                </label>
                <Select value={selectedRole} onValueChange={handleRoleChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminDetails?.role === "main_admin" && (
                      <>
                        <SelectItem value="main_admin">Main Admin</SelectItem>
                        <SelectItem value="department_admin">Department Admin</SelectItem>
                      </>
                    )}
                    <SelectItem value="event_admin">Event Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedRole === "department_admin" && (
                <div className="space-y-1">
                  <label htmlFor="department" className="text-sm font-medium">
                    Department
                  </label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedRole === "event_admin" && (
                <>
                  {adminDetails?.role === "department_admin" ? (
                    <div className="space-y-1">
                      <label htmlFor="event" className="text-sm font-medium">
                        Event
                      </label>
                      <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                        <SelectContent>
                          {events
                            .filter((event) => event.department_id === adminDetails.department_id)
                            .map((event) => (
                              <SelectItem key={event.id} value={event.id}>
                                {event.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label htmlFor="department" className="text-sm font-medium">
                          Department
                        </label>
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedDepartment && (
                        <div className="space-y-1">
                          <label htmlFor="event" className="text-sm font-medium">
                            Event
                          </label>
                          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select an event" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredEvents.length > 0 ? (
                                filteredEvents.map((event) => (
                                  <SelectItem key={event.id} value={event.id}>
                                    {event.title}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>
                                  No events available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateAdmin}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Create Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Event</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length > 0 ? (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.username}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                      {admin.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {admin.department_id ? (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{getDepartmentName(admin.department_id)}</span>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    {admin.event_id ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{getEventName(admin.event_id)}</span>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmation({ id: admin.id, email: admin.username })}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      aria-label={`Delete admin ${admin.username}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No admin users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!deleteConfirmation}
        onOpenChange={() => setDeleteConfirmation(null)}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the admin user <strong>{deleteConfirmation?.email}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmation(null)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmation) {
                  handleDeleteAdmin(deleteConfirmation.id);
                  setDeleteConfirmation(null);
                }
              }}
              className="w-full sm:w-auto"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}