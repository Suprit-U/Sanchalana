import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Department, Coordinator } from "@/types";
import { Loader2, Plus, PenSquare, Trash2, Search } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const departmentSchema = z.object({
  name: z.string().min(1, { message: "Department name is required" }),
  short_name: z.string().min(1, { message: "Short name is required" }),
  icon: z.string().optional(),
  coordinators: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, { message: "Coordinator name is required" }),
        phone_number: z
          .string()
          .min(10, { message: "Phone number must be at least 10 digits" })
          .regex(/^\d+$/, { message: "Phone number must contain only digits" }),
      })
    )
    .optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export default function DepartmentsManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);

  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      short_name: "",
      icon: "",
      coordinators: [],
    },
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchDepartments();
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (currentDepartment) {
      form.reset({
        name: currentDepartment.name,
        short_name: currentDepartment.short_name,
        icon: currentDepartment.icon || "",
        coordinators: currentDepartment.coordinators || [],
      });
    } else {
      form.reset({
        name: "",
        short_name: "",
        icon: "",
        coordinators: [],
      });
    }
  }, [currentDepartment, form]);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("departments")
        .select(`
          id,
          name,
          short_name,
          icon,
          coordinators (
            id,
            name,
            phone_number
          )
        `)
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      toast({
        variant: "destructive",
        title: "Error fetching departments",
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoordinators = async (departmentId: string) => {
    try {
      const { data, error } = await supabase
        .from("coordinators")
        .select("*")
        .eq("department_id", departmentId)
        .order("name");

      if (error) throw error;
      setCoordinators(data || []);
    } catch (error: any) {
      console.error("Error fetching coordinators:", error);
      toast({
        variant: "destructive",
        title: "Error fetching coordinators",
        description: error.message || "Please try again later.",
      });
    }
  };

  const handleAddEdit = async (values: DepartmentFormValues) => {
    setIsSubmitting(true);
    try {
      if (currentDepartment) {
        const { error } = await supabase
          .from("departments")
          .update({
            name: values.name,
            short_name: values.short_name,
            icon: values.icon,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentDepartment.id);

        if (error) throw error;

        // Update coordinators
        if (values.coordinators) {
          const existingCoordinatorIds = currentDepartment.coordinators?.map((c) => c.id) || [];
          const newCoordinators = values.coordinators.filter((c) => !c.id);
          const updatedCoordinators = values.coordinators.filter((c) => c.id);

          // Delete removed coordinators
          const coordinatorsToDelete = existingCoordinatorIds.filter(
            (id) => !updatedCoordinators.some((c) => c.id === id)
          );
          if (coordinatorsToDelete.length > 0) {
            await supabase.from("coordinators").delete().in("id", coordinatorsToDelete);
          }

          // Insert new coordinators
          if (newCoordinators.length > 0) {
            await supabase.from("coordinators").insert(
              newCoordinators.map((c) => ({
                department_id: currentDepartment.id,
                name: c.name,
                phone_number: c.phone_number,
              }))
            );
          }

          // Update existing coordinators
          for (const coordinator of updatedCoordinators) {
            if (coordinator.id) {
              await supabase
                .from("coordinators")
                .update({
                  name: coordinator.name,
                  phone_number: coordinator.phone_number,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", coordinator.id);
            }
          }
        }

        toast({
          title: "Department updated",
          description: "Department and coordinators have been updated successfully.",
        });
      } else {
        const { error } = await supabase.from("departments").insert({
          name: values.name,
          short_name: values.short_name,
          icon: values.icon || null,
        });

        if (error) throw error;

        toast({
          title: "Department created",
          description: "New department has been created successfully.",
        });
      }

      await fetchDepartments();
      setIsDialogOpen(false);
      setCurrentDepartment(null);
    } catch (error: any) {
      console.error("Error saving department:", error);
      toast({
        variant: "destructive",
        title: "Error saving department",
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDepartment = (department: Department) => {
    setCurrentDepartment(department);
    setIsDialogOpen(true);
  };

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    try {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", departmentToDelete);

      if (error) throw error;

      toast({
        title: "Department deleted",
        description: "Department has been deleted successfully.",
      });

      await fetchDepartments();
      if (selectedDepartmentId === departmentToDelete) {
        setSelectedDepartmentId(null);
        setCoordinators([]);
      }
      setIsDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    } catch (error: any) {
      console.error("Error deleting department:", error);
      toast({
        variant: "destructive",
        title: "Error deleting department",
        description: error.message || "Please try again later.",
      });
    }
  };

  const handleDeleteCoordinator = async (coordinatorId: string) => {
    try {
      const { error } = await supabase
        .from("coordinators")
        .delete()
        .eq("id", coordinatorId);

      if (error) throw error;

      toast({
        title: "Coordinator deleted",
        description: "Coordinator has been deleted successfully.",
      });

      if (selectedDepartmentId) {
        await fetchCoordinators(selectedDepartmentId);
      }
    } catch (error: any) {
      console.error("Error deleting coordinator:", error);
      toast({
        variant: "destructive",
        title: "Error deleting coordinator",
        description: error.message || "Please try again later.",
      });
    }
  };

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.short_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      toast({
        title: "Logout successful",
        description: "You have been logged out.",
      });
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to log out. Please try again.",
      });
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Departments Management</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto">
            Logout
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {currentDepartment ? "Edit Department" : "Add New Department"}
                </DialogTitle>
                <DialogDescription>
                  {currentDepartment
                    ? "Update the details for this department."
                    : "Create a new department by filling out the form below."}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddEdit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Computer Science" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="short_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="CS" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="💻" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {currentDepartment && (
                    <FormField
                      control={form.control}
                      name="coordinators"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coordinators</FormLabel>
                          {field.value?.map((coordinator, index) => (
                            <div key={coordinator.id || index} className="space-y-2 mb-4 border p-4 rounded">
                              <FormControl>
                                <Input
                                  placeholder="Coordinator Name"
                                  value={coordinator.name}
                                  onChange={(e) => {
                                    const newCoordinators = [...field.value];
                                    newCoordinators[index] = {
                                      ...newCoordinators[index],
                                      name: e.target.value,
                                    };
                                    field.onChange(newCoordinators);
                                  }}
                                />
                              </FormControl>
                              <FormControl>
                                <Input
                                  placeholder="Phone Number"
                                  value={coordinator.phone_number}
                                  onChange={(e) => {
                                    const newCoordinators = [...field.value];
                                    newCoordinators[index] = {
                                      ...newCoordinators[index],
                                      phone_number: e.target.value,
                                    };
                                    field.onChange(newCoordinators);
                                  }}
                                />
                              </FormControl>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const newCoordinators = field.value.filter((_, i) => i !== index);
                                  field.onChange(newCoordinators);
                                }}
                                className="w-full"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              field.onChange([
                                ...(field.value || []),
                                { name: "", phone_number: "" },
                              ])
                            }
                            className="w-full"
                          >
                            Add Coordinator
                          </Button>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : currentDepartment ? "Update Department" : "Create Department"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        <div className="relative max-w-full sm:max-w-sm mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-full"
          />
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Department Name</TableHead>
                <TableHead className="w-[30%] hidden sm:table-cell">Short Name</TableHead>
                <TableHead className="w-[20%] hidden md:table-cell">Icon</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    {searchQuery
                      ? "No departments match your search criteria."
                      : "No departments found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDepartments.map((department) => (
                  <TableRow
                    key={department.id}
                    onClick={() => {
                      setSelectedDepartmentId(department.id);
                      fetchCoordinators(department.id);
                    }}
                    className={
                      selectedDepartmentId === department.id ? "bg-muted" : "cursor-pointer"
                    }
                  >
                    <TableCell className="font-medium">
                      <div className="sm:hidden">
                        <div className="font-medium">{department.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {department.short_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {department.icon || "No icon"}
                        </div>
                      </div>
                      <div className="hidden sm:block">{department.name}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{department.short_name}</TableCell>
                    <TableCell className="hidden md:table-cell">{department.icon || ""}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditDepartment(department);
                          }}
                          className="h-8 w-8"
                        >
                          <PenSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDepartmentToDelete(department.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedDepartmentId && (
        <div className="space-y-6 mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold">Coordinators</h2>
            <Button
              onClick={() => {
                navigate("/admin/coordinators/add");
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Coordinator
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Phone Number</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coordinators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      No coordinators found for this department.
                    </TableCell>
                  </TableRow>
                ) : (
                  coordinators.map((coordinator) => (
                    <TableRow key={coordinator.id}>
                      <TableCell className="font-medium">
                        <div className="sm:hidden">
                          <div className="font-medium">{coordinator.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {coordinator.phone_number}
                          </div>
                        </div>
                        <div className="hidden sm:block">{coordinator.name}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {coordinator.phone_number}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigate(`/admin/coordinators/edit/${coordinator.id}`);
                            }}
                            className="h-8 w-8"
                          >
                            <PenSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCoordinator(coordinator.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this department? This will also delete all associated
              events and coordinators. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDepartment}
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