import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Event, Department } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const teamMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  usn: z
    .string()
    .min(5, "USN must be at least 5 characters")
    .max(10, "USN cannot exceed 10 characters"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(13, "Phone number cannot exceed 13 characters"),
});

type TeamMember = z.infer<typeof teamMemberSchema>;

const createRegistrationSchema = (teamSize: number) => {
  return z.object({
    paymentMethod: z.string().min(1, "Please select a payment method"),
    teamMembers: z.array(teamMemberSchema).min(1).max(teamSize),
  });
};

type RegistrationFormValues = {
  paymentMethod: string;
  teamMembers: TeamMember[];
};

export default function RegistrationPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [registrationSchema, setRegistrationSchema] = useState(createRegistrationSchema(1));

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      paymentMethod: "",
      teamMembers: profile ? [
        {
          name: profile.name,
          usn: profile.usn,
          phone: profile.phone,
        }
      ] : [{ name: "", usn: "", phone: "" }],
    },
  });

  useEffect(() => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to register for events",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    async function fetchEventData() {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single();
        
        if (eventError) throw eventError;
        setEvent(eventData);
        
        if (eventData) {
          setRegistrationSchema(createRegistrationSchema(eventData.team_size));
        }
        
        if (eventData?.department_id) {
          const { data: deptData, error: deptError } = await supabase
            .from("departments")
            .select("*")
            .eq("id", eventData.department_id)
            .single();
          
          if (deptError) throw deptError;
          setDepartment(deptData);
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEventData();
  }, [id, navigate, user]);

  const addTeamMember = () => {
    if (!event) return;
    
    const currentMembers = form.getValues().teamMembers;
    if (currentMembers.length < event.team_size) {
      form.setValue("teamMembers", [
        ...currentMembers,
        { name: "", usn: "", phone: "" },
      ]);
    }
  };

  const removeTeamMember = (index: number) => {
    const currentMembers = form.getValues().teamMembers;
    if (currentMembers.length > 1) {
      form.setValue("teamMembers", currentMembers.filter((_, i) => i !== index));
    }
  };

  const onSubmit = async (data: RegistrationFormValues) => {
    if (!event || !user || !profile) return;
    
    try {
      setIsSubmitting(true);
      
      const teamId = `TEAM-${uuidv4().substring(0, 8)}`;
      
      const registrationData = {
        event_id: event.id,
        user_id: user.id,
        team_id: teamId,
        team_members: data.teamMembers,
        payment_method: data.paymentMethod,
        payment_status: "Pending",
      };
      
      const { error } = await supabase
        .from("registrations")
        .insert(registrationData);
      
      if (error) throw error;
      
      toast({
        title: "Registration successful!",
        description: "Your team has been registered for the event.",
      });
      
      if (data.paymentMethod === "QR Code") {
        setShowQRDialog(true);
      } else {
        navigate("/registrations");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "There was an error processing your registration.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseQRDialog = () => {
    setShowQRDialog(false);
    navigate("/registrations");
  };

  if (isLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Register for {event.title}
          </h1>
          {department && (
            <p className="text-muted-foreground">
              {department.name} Department
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>
              Please enter details for each team member. Maximum team size is {event.team_size}.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {form.watch("teamMembers").map((_, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">
                        {index === 0 ? "Team Leader" : `Team Member ${index + 1}`}
                      </h3>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamMember(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`teamMembers.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`teamMembers.${index}.usn`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>USN</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`teamMembers.${index}.phone`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                
                {form.watch("teamMembers").length < (event?.team_size || 1) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTeamMember}
                    className="w-full"
                  >
                    Add Team Member
                  </Button>
                )}
                
                <div className="pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="QR Code">QR Code Payment</SelectItem>
                            <SelectItem value="Cash">Cash Payment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="bg-muted/30 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Registration Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Event:</span>
                      <span>{event.title}</span>
                    </div>
                    {department && (
                      <div className="flex justify-between">
                        <span>Department:</span>
                        <span>{department.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Team Size:</span>
                      <span>{form.watch("teamMembers").length}/{event.team_size}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Registration Fee:</span>
                      <span>₹{event.registration_fee}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Register & Pay Now"
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  By registering, you agree to participate following the rules and code of conduct of Sanchalana 2025.
                </p>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Dialog open={showQRDialog} onOpenChange={handleCloseQRDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Scan QR Code to Pay</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center py-4">
              {event.payment_qr_url ? (
                <img 
                  src={event.payment_qr_url} 
                  alt="Payment QR Code" 
                  className="w-64 h-64 object-contain"
                />
              ) : (
                <div className="w-64 h-64 bg-muted/30 flex items-center justify-center">
                  <p className="text-center text-muted-foreground">
                    QR code not available. Please pay using cash at the registration desk.
                  </p>
                </div>
              )}
              <p className="mt-4 text-center text-sm">
                Registration Fee: ₹{event.registration_fee}
              </p>
              <p className="mt-2 text-center text-muted-foreground text-xs">
                After payment, show the receipt to event coordinator to confirm your registration.
              </p>
              <Button className="mt-6" onClick={handleCloseQRDialog}>
                View My Registrations
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
