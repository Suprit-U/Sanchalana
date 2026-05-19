import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { parseRegistrationCSV, addToUploadHistory, getUploadHistory } from "@/utils/departmentDataUtils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";

export function AdminManagementSection({ role, ...props }: { role: string }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState(getUploadHistory());
  const [registrationStats, setRegistrationStats] = useState<any>(null);
  const [eventFormData, setEventFormData] = useState({
    eventName: "",
    eventDate: "",
    eventVenue: "",
    eventDescription: "",
    eventFee: "0",
    teamSize: "1",
    rules: "",
  });

  // Only show tabs based on role
  // For Main Admin: only show Data Import
  // For Department Admin: keep other tabs
  let availableTabs = [];

  if (role === "main_admin") {
    availableTabs = [
      { value: "data-import", label: "Data Import" },
    ];
  } else {
    availableTabs = [
      { value: "data-import", label: "Data Import" },
      { value: "event-management", label: "Event Management" },
      // ... add more tabs if needed for department admin
    ];
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const stats = await parseRegistrationCSV(file);
      setRegistrationStats(stats);
      addToUploadHistory(file.name, file.size);
      setUploadHistory(getUploadHistory());
      
      toast({
        title: "Upload Successful",
        description: `Processed ${stats.total} registrations from ${file.name}`,
      });
    } catch (error) {
      console.error("Error processing CSV:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error processing the CSV file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEventFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!eventFormData.eventName || !eventFormData.eventDate || !eventFormData.eventVenue) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Process form data
    toast({
      title: "Event Created",
      description: `Successfully created event: ${eventFormData.eventName}`,
    });

    // Reset form
    setEventFormData({
      eventName: "",
      eventDate: "",
      eventVenue: "",
      eventDescription: "",
      eventFee: "0",
      teamSize: "1",
      rules: "",
    });
  };

  return (
    <Tabs defaultValue={availableTabs[0].value} className="w-full">
      <TabsList className="mb-4">
        {availableTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="data-import">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Registration Data</CardTitle>
              <CardDescription>
                Upload a CSV file containing registration data to update the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="csv-upload">Upload CSV File</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <p className="text-sm text-gray-500">
                    The CSV should contain columns for name, email, phone, event name, and payment status.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button disabled={isUploading}>
                {isUploading ? "Processing..." : "Upload and Process"}
              </Button>
            </CardFooter>
          </Card>

          {registrationStats && (
            <Card>
              <CardHeader>
                <CardTitle>Registration Statistics</CardTitle>
                <CardDescription>
                  Summary of processed registration data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Total Registrations</h4>
                    <p className="text-3xl font-bold">{registrationStats.total}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Department Breakdown</h4>
                    <div className="space-y-2">
                      {registrationStats.departmentBreakdown.map((dept: any) => (
                        <div key={dept.department} className="flex justify-between items-center">
                          <span>{dept.department}</span>
                          <span className="font-medium">{dept.count} ({dept.percent}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {uploadHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload History</CardTitle>
                <CardDescription>
                  Recent CSV file uploads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uploadHistory.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="font-medium">{item.name}</span>
                      <div className="text-sm text-gray-500">
                        <span className="mr-4">{item.date}</span>
                        <span>{item.size}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
      {role !== "main_admin" && (
        <TabsContent value="event-management">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Event</CardTitle>
                <CardDescription>
                  Create a new event for your department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="eventName">Event Name *</Label>
                    <Input
                      id="eventName"
                      name="eventName"
                      value={eventFormData.eventName}
                      onChange={handleEventFormChange}
                      placeholder="Enter event name"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="eventDate">Date *</Label>
                      <Input
                        id="eventDate"
                        name="eventDate"
                        value={eventFormData.eventDate}
                        onChange={handleEventFormChange}
                        placeholder="May 10, 2025"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="eventVenue">Venue *</Label>
                      <Input
                        id="eventVenue"
                        name="eventVenue"
                        value={eventFormData.eventVenue}
                        onChange={handleEventFormChange}
                        placeholder="Main Auditorium"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="eventFee">Registration Fee (₹)</Label>
                      <Input
                        id="eventFee"
                        name="eventFee"
                        type="number"
                        min="0"
                        value={eventFormData.eventFee}
                        onChange={handleEventFormChange}
                        placeholder="0"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="teamSize">Team Size</Label>
                      <Input
                        id="teamSize"
                        name="teamSize"
                        type="number"
                        min="1"
                        value={eventFormData.teamSize}
                        onChange={handleEventFormChange}
                        placeholder="1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="eventDescription">Description</Label>
                    <Textarea
                      id="eventDescription"
                      name="eventDescription"
                      value={eventFormData.eventDescription}
                      onChange={handleEventFormChange}
                      placeholder="Enter event description"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="rules">Rules & Guidelines</Label>
                    <Textarea
                      id="rules"
                      name="rules"
                      value={eventFormData.rules}
                      onChange={handleEventFormChange}
                      placeholder="Enter rules (one per line)"
                      rows={5}
                    />
                    <p className="text-xs text-gray-500">Enter each rule on a new line</p>
                  </div>
                  
                  <Button type="submit" className="w-full">Create Event</Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Manage Existing Events</CardTitle>
                <CardDescription>
                  View and edit your department's events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Carousel className="w-full">
                  <CarouselContent>
                    {[1, 2, 3].map((id) => (
                      <CarouselItem key={id} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                          <Card>
                            <CardHeader className="p-4">
                              <CardTitle className="text-lg">Sample Event {id}</CardTitle>
                              <CardDescription>May 10, 2025 • Main Auditorium</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <p className="text-sm">This is a sample event description.</p>
                            </CardContent>
                            <CardFooter className="p-4 pt-0 flex justify-between">
                              <Button variant="outline" size="sm" onClick={() => navigate(`/admin/events/${id}`)}>
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm">Delete</Button>
                            </CardFooter>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
