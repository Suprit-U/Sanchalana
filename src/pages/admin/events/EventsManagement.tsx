import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Event, Department, Admin } from "@/types";
import { Loader2, Plus, PenSquare, Trash2, Search, Upload, Image, QrCode, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const eventSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  department_id: z.string().min(1, { message: "Department is required" }),
  venue: z.string().optional(),
  conduction_venue: z.string().optional(),
  date: z.string().optional(),
  team_size: z.coerce.number().min(1),
  registration_fee: z.coerce.number().min(0),
  event_type: z.string().min(1, { message: "Event type is required" }),
  is_trending: z.boolean().default(false),
  image_url: z.string().optional(),
  qr_code_url: z.string().optional(),
  payment_qr_url: z.string().optional(),
  faculty_coordinators: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Name is required" }),
        phone: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  student_coordinators: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Name is required" }),
        phone: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventsManagementProps {
  adminDetails: Admin | null;
}

export default function EventsManagement({ adminDetails }: EventsManagementProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingQrCode, setUploadingQrCode] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewQrCode, setPreviewQrCode] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const qrCodeInputRef = useRef<HTMLInputElement>(null);

  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      department_id: "",
      venue: "",
      conduction_venue: "",
      date: "",
      team_size: 1,
      registration_fee: 0,
      event_type: "",
      is_trending: false,
      image_url: "",
      qr_code_url: "",
      payment_qr_url: "",
      faculty_coordinators: [],
      student_coordinators: [],
    },
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }

    fetchData();

    const assignRandomPlaceholderImages = async () => {
      const placeholderImages = [
        "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
        "https://images.unsplash.com/photo-1518770660439-4636190af475",
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
        "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1",
      ];

      try {
        const { data: eventsWithoutImages, error } = await supabase
          .from("events")
          .select("id")
          .is("image_url", null);

        if (error) throw error;

        if (eventsWithoutImages && eventsWithoutImages.length > 0) {
          for (const event of eventsWithoutImages) {
            const randomImage =
              placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
            const imageUrl = `${randomImage}?w=600&h=400&fit=crop&auto=format`;

            await supabase
              .from("events")
              .update({ image_url: imageUrl })
              .eq("id", event.id);
          }

          await fetchData();
        }
      } catch (error) {
        console.error("Error assigning placeholder images:", error);
      }
    };

    assignRandomPlaceholderImages();
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (currentEvent) {
      form.reset({
        title: currentEvent.title,
        description: currentEvent.description || "",
        department_id: currentEvent.department_id,
        venue: currentEvent.venue || "",
        conduction_venue: currentEvent.conduction_venue || "",
        date: currentEvent.date || "",
        team_size: currentEvent.team_size,
        registration_fee: currentEvent.registration_fee,
        event_type: currentEvent.event_type,
        is_trending: currentEvent.is_trending || false,
        image_url: currentEvent.image_url || "",
        qr_code_url: currentEvent.qr_code_url || "",
        payment_qr_url: currentEvent.payment_qr_url || "",
        faculty_coordinators: currentEvent.faculty_coordinators || [],
        student_coordinators: currentEvent.student_coordinators || [],
      });

      setPreviewImage(currentEvent.image_url || null);
      setPreviewQrCode(currentEvent.qr_code_url || null);
    } else {
      form.reset({
        title: "",
        description: "",
        department_id:
          adminDetails?.role === "department_admin" ? adminDetails.department_id || "" : "",
        venue: "",
        conduction_venue: "",
        date: "",
        team_size: 1,
        registration_fee: 0,
        event_type: "",
        is_trending: false,
        image_url: "",
        qr_code_url: "",
        payment_qr_url: "",
        faculty_coordinators: [],
        student_coordinators: [],
      });

      setPreviewImage(null);
      setPreviewQrCode(null);
    }
  }, [currentEvent, form, adminDetails]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let eventQuery = supabase.from("events").select("*");

      if (adminDetails?.role === "department_admin" && adminDetails.department_id) {
        eventQuery = eventQuery.eq("department_id", adminDetails.department_id);
      } else if (adminDetails?.role === "event_admin" && adminDetails.event_id) {
        eventQuery = eventQuery.eq("id", adminDetails.event_id);
      }

      const { data: eventData, error: eventError } = await eventQuery.order("created_at", {
        ascending: false,
      });

      if (eventError) throw eventError;
      setEvents(eventData || []);

      const { data: deptData, error: deptError } = await supabase
        .from("departments")
        .select("*")
        .order("name");

      if (deptError) throw deptError;
      setDepartments(deptData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEdit = async (values: EventFormValues) => {
    setIsSubmitting(true);
    try {
      if (
        adminDetails?.role === "department_admin" &&
        adminDetails.department_id !== values.department_id
      ) {
        toast({
          variant: "destructive",
          title: "Permission denied",
          description: "You can only manage events for your department.",
        });
        setIsSubmitting(false);
        return;
      }

      if (
        adminDetails?.role === "event_admin" &&
        currentEvent?.id !== adminDetails.event_id
      ) {
        toast({
          variant: "destructive",
          title: "Permission denied",
          description: "You can only manage your assigned event.",
        });
        setIsSubmitting(false);
        return;
      }

      const eventData = {
        title: values.title,
        description: values.description,
        department_id: values.department_id,
        venue: values.venue,
        conduction_venue: values.conduction_venue,
        date: values.date,
        team_size: values.team_size,
        registration_fee: values.registration_fee,
        event_type: values.event_type,
        is_trending: values.is_trending,
        image_url: values.image_url,
        qr_code_url: values.qr_code_url,
        payment_qr_url: values.payment_qr_url,
        faculty_coordinators: values.faculty_coordinators,
        student_coordinators: values.student_coordinators,
      };

      if (currentEvent) {
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", currentEvent.id);

        if (error) throw error;

        toast({
          title: "Event updated",
          description: "Event has been updated successfully.",
        });
      } else {
        const { error } = await supabase.from("events").insert(eventData);

        if (error) throw error;

        toast({
          title: "Event created",
          description: "New event has been created successfully.",
        });
      }

      await fetchData();
      setIsDialogOpen(false);
      setCurrentEvent(null);
    } catch (error: any) {
      console.error("Error saving event:", error);
      toast({
        variant: "destructive",
        title: "Error saving event",
        description: error?.message || "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "image" | "qrCode"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      if (fileType === "image") {
        setUploadingImage(true);
      } else {
        setUploadingQrCode(true);
      }

      const bucketName = fileType === "image" ? "event_images" : "qr_codes";

      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (fileType === "image") {
        form.setValue("image_url", publicUrlData.publicUrl);
        setPreviewImage(publicUrlData.publicUrl);
      } else {
        form.setValue("payment_qr_url", publicUrlData.publicUrl);
        form.setValue("qr_code_url", publicUrlData.publicUrl);
        setPreviewQrCode(publicUrlData.publicUrl);
      }
    } catch (error: any) {
      console.error(`Error uploading ${fileType}:`, error);
      toast({
        variant: "destructive",
        title: `Error uploading ${fileType}`,
        description: error?.message || "Please try again later.",
      });
    } finally {
      if (fileType === "image") {
        setUploadingImage(false);
      } else {
        setUploadingQrCode(false);
      }
    }
  };

  const handleEditEvent = (event: Event) => {
    if (adminDetails?.role === "event_admin" && event.id !== adminDetails.event_id) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You can only edit your assigned event.",
      });
      return;
    }

    setCurrentEvent(event);
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    if (adminDetails?.role === "event_admin") {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "Event admins cannot delete events.",
      });
      setIsDeleteDialogOpen(false);
      return;
    }

    const event = events.find((e) => e.id === eventToDelete);

    if (
      adminDetails?.role === "department_admin" &&
      event?.department_id !== adminDetails.department_id
    ) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You can only delete events from your department.",
      });
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      const { error } = await supabase.from("events").delete().eq("id", eventToDelete);

      if (error) throw error;

      toast({
        title: "Event deleted",
        description: "Event has been deleted successfully.",
      });

      await fetchData();
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast({
        variant: "destructive",
        title: "Error deleting event",
        description: error?.message || "Please try again later.",
      });
    }
  };

  const openDeleteDialog = (eventId: string) => {
    setEventToDelete(eventId);
    setIsDeleteDialogOpen(true);
  };

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      departments
        .find((d) => d.id === event.department_id)
        ?.name.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const canAddEvents = adminDetails?.role !== "event_admin";

  const getAvailableDepartments = () => {
    if (adminDetails?.role === "department_admin" && adminDetails.department_id) {
      return departments.filter((dept) => dept.id === adminDetails.department_id);
    }
    return departments;
  };

  const CoordinatorFields = ({
    type,
    control,
    name,
  }: {
    type: "faculty_coordinators" | "student_coordinators";
    control: any;
    name: string;
  }) => {
    const { fields, append, remove } = useFieldArray({
      control,
      name: type,
    });

    return (
      <FormItem>
        <FormLabel>{name}</FormLabel>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-col sm:flex-row items-end gap-2">
              <FormField
                control={control}
                name={`${type}.${index}.name`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`${type}.${index}.phone`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Phone (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => remove(index)}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: "", phone: "" })}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Add {name}
          </Button>
        </div>
        <FormMessage />
      </FormItem>
    );
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
        <h2 className="text-2xl font-bold">Events Management</h2>

        {canAddEvents && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentEvent(null)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{currentEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
                <DialogDescription>
                  {currentEvent
                    ? "Update the details for this event."
                    : "Create a new event by filling out the form below."}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddEdit)} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title*</FormLabel>
                            <FormControl>
                              <Input placeholder="Event title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="department_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department*</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                              disabled={adminDetails?.role === "department_admin"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getAvailableDepartments().map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="event_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Type*</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Technical">Technical</SelectItem>
                                <SelectItem value="Non-Technical">Non-Technical</SelectItem>
                                <SelectItem value="Cultural">Cultural</SelectItem>
                                <SelectItem value="Workshop">Workshop</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="team_size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Size*</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="registration_fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration Fee*</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="venue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration Venue</FormLabel>
                            <FormControl>
                              <Input placeholder="Where to register" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="conduction_venue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conduction Venue</FormLabel>
                            <FormControl>
                              <Input placeholder="Where event will be held" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <FormLabel>Event Image</FormLabel>
                          <p className="text-sm text-muted-foreground mt-1">
                            Recommended resolution: 1920x1080 or 1280x720 (16:9 aspect ratio)
                          </p>
                          <div className="mt-2 flex flex-col items-center justify-center space-y-2">
                            <div className="border rounded-md h-40 w-full overflow-hidden bg-secondary/20 flex items-center justify-center">
                              {previewImage ? (
                                <img
                                  src={previewImage}
                                  alt="Event preview"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Image className="h-12 w-12 text-muted-foreground" />
                              )}
                            </div>
                            <Input
                              ref={imageInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadImage(e, "image")}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => imageInputRef.current?.click()}
                              disabled={uploadingImage}
                              className="w-full"
                            >
                              {uploadingImage ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="mr-2 h-4 w-4" />
                              )}
                              {previewImage ? "Change Image" : "Upload Image"}
                            </Button>
                            <FormField
                              control={form.control}
                              name="image_url"
                              render={({ field }) => (
                                <FormItem className="hidden">
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <div>
                          <FormLabel>Payment QR Code</FormLabel>
                          <div className="mt-2 flex flex-col items-center justify-center space-y-2">
                            <div className="border rounded-md h-40 w-full overflow-hidden bg-secondary/20 flex items-center justify-center">
                              {previewQrCode ? (
                                <img
                                  src={previewQrCode}
                                  alt="QR Code preview"
                                  className="h-full w-full object-contain p-2"
                                />
                              ) : (
                                <QrCode className="h-12 w-12 text-muted-foreground" />
                              )}
                            </div>
                            <Input
                              ref={qrCodeInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadImage(e, "qrCode")}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => qrCodeInputRef.current?.click()}
                              disabled={uploadingQrCode}
                              className="w-full"
                            >
                              {uploadingQrCode ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="mr-2 h-4 w-4" />
                              )}
                              {previewQrCode ? "Change QR Code" : "Upload QR Code"}
                            </Button>
                            <FormField
                              control={form.control}
                              name="qr_code_url"
                              render={({ field }) => (
                                <FormItem className="hidden">
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="is_trending"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="cursor-pointer">Featured event</FormLabel>
                                <p className="text-xs text-muted-foreground">
                                  Display this event on the homepage carousel
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Event description"
                            className="min-h-32"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <CoordinatorFields
                    type="faculty_coordinators"
                    control={form.control}
                    name="Faculty Coordinators"
                  />
                  <CoordinatorFields
                    type="student_coordinators"
                    control={form.control}
                    name="Student Coordinators"
                  />

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
                      ) : currentEvent ? "Update Event" : "Create Event"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div>
        <div className="flex items-center max-w-full sm:max-w-sm mb-4 relative">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events by title or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-full"
          />
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell">Fee</TableHead>
                <TableHead className="hidden lg:table-cell">Team Size</TableHead>
                <TableHead className="hidden lg:table-cell">Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    {searchQuery ? "No events match your search criteria." : "No events found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="hidden sm:table-cell">
                      {event.image_url ? (
                        <div className="h-12 w-16 rounded overflow-hidden">
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-16 rounded bg-secondary/20 flex items-center justify-center">
                          <Image className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="sm:hidden">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {departments.find((d) => d.id === event.department_id)?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {event.date ? new Date(event.date).toLocaleDateString() : "Not set"}
                        </div>
                        <div className="text-sm text-muted-foreground">₹{event.registration_fee}</div>
                        <div className="text-sm text-muted-foreground">Team: {event.team_size}</div>
                        <div className="text-sm text-muted-foreground">
                          Featured: {event.is_trending ? "Yes" : "No"}
                        </div>
                      </div>
                      <div className="hidden sm:block">{event.title}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {departments.find((d) => d.id === event.department_id)?.name || "Unknown"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {event.date ? new Date(event.date).toLocaleDateString() : "Not set"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">₹{event.registration_fee}</TableCell>
                    <TableCell className="hidden lg:table-cell">{event.team_size}</TableCell>
                    <TableCell className="hidden lg:table-cell">{event.is_trending ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEvent(event)}
                          className="h-8 w-8"
                        >
                          <PenSquare className="h-4 w-4" />
                        </Button>
                        {(adminDetails?.role === "main_admin" ||
                          adminDetails?.role === "department_admin") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(event.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
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
              onClick={handleDeleteEvent}
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