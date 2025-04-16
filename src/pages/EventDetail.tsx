import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Event, Department } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, Tag, Image } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchEventData() {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single();
        
        if (eventError) throw eventError;
        setEvent(eventData);
        
        if (eventData?.department_id) {
          // Fetch department details
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
  }, [id]);

  const handleRegister = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    navigate(`/register/${id}`);
  };

  // Helper function to parse and normalize coordinators
  const getCoordinators = (coordinatorsData: any) => {
    if (!coordinatorsData || typeof coordinatorsData !== 'object') return [];
    try {
      return Array.isArray(coordinatorsData)
        ? coordinatorsData
        : [coordinatorsData];
    } catch (error) {
      console.error("Error parsing coordinators:", error);
      return [];
    }
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
        <Button asChild>
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 animate-fade-in">
          <div className="mb-6">
            {event.image_url ? (
              <div className="w-full h-48 md:h-64 rounded-lg overflow-hidden mb-6">
                <img 
                  src={event.image_url} 
                  alt={event.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}
            
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {event.title}
            </h1>
            {department && (
              <Link
                to={`/departments/${department.id}`}
                className="text-primary hover:underline"
              >
                {department.name} Department
              </Link>
            )}
          </div>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Event Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-muted-foreground">
                      {event.date ? new Date(event.date).toLocaleDateString() : "To be announced"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Venue</p>
                    <p className="text-muted-foreground">
                      {event.venue || "To be announced"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Conduction Venue</p>
                    <p className="text-muted-foreground">
                      {event.conduction_venue || event.venue || "To be announced"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Team Size</p>
                    <p className="text-muted-foreground">Maximum {event.team_size} members</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Tag className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Registration Fee</p>
                    <p className="text-muted-foreground">₹{event.registration_fee}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Event Type</p>
                    <p className="text-muted-foreground">{event.event_type}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-line">{event.description || "No description available."}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="animate-slide-up">
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-2">Ready to participate?</h2>
                <p className="text-muted-foreground mb-4">
                  Register for this event and showcase your skills
                </p>
                <Button 
                  onClick={handleRegister}
                  size="lg" 
                  className="w-full"
                >
                  Register Now
                </Button>
              </div>

              {event.qr_code_url && (
                <div className="border-t pt-4 mb-6">
                  <h3 className="font-semibold mb-2 text-center">Payment QR Code</h3>
                  <div className="flex justify-center">
                    <div className="w-48 h-48 border rounded-md p-2 bg-white">
                      <img 
                        src={event.qr_code_url} 
                        alt="Payment QR Code" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Scan to make a payment
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Coordinators</h3>
                {getCoordinators(event.faculty_coordinators).length === 0 &&
                  getCoordinators(event.student_coordinators).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No coordinators assigned.
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {getCoordinators(event.faculty_coordinators).map((coordinator: any, index: number) => (
                    <Card
                      key={`faculty-${index}`}
                      className="animate-fade-in hover:shadow-md transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <h2 className="text-xl font-bold mb-2">{coordinator.name || 'Unknown'}</h2>
                        {coordinator.phone && (
                          <p className="text-sm mb-1">
                            <span className="font-medium">Phone No:</span> {coordinator.phone}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {getCoordinators(event.student_coordinators).map((coordinator: any, index: number) => (
                    <Card
                      key={`student-${index}`}
                      className="animate-fade-in hover:shadow-md transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <h2 className="text-xl font-bold mb-2">{coordinator.name || 'Unknown'}</h2>
                        {coordinator.phone && (
                          <p className="text-sm mb-1">
                            <span className="font-medium">Phone No:</span> {coordinator.phone}
                          </p>
                        )}
                        {coordinator.role && (
                          <p className="text-sm text-muted-foreground">{coordinator.role}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}