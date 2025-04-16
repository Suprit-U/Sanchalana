import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Department as DepartmentType, Event, Coordinator } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function DepartmentPage() {
  const { id } = useParams<{ id: string }>();
  const [department, setDepartment] = useState<DepartmentType | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDepartmentData() {
      if (!id) {
        setError("No department ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch department details
        const { data: deptData, error: deptError } = await supabase
          .from("departments")
          .select("*")
          .eq("id", id)
          .single();

        if (deptError) {
          throw new Error(`Department fetch error: ${deptError.message}`);
        }
        if (!deptData) {
          throw new Error("Department not found");
        }
        setDepartment(deptData);

        // Fetch department events
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("department_id", id);

        if (eventError) {
          throw new Error(`Events fetch error: ${eventError.message}`);
        }
        setEvents(eventData || []);

        // Fetch department coordinators
        const { data: coordData, error: coordError } = await supabase
          .from("coordinators")
          .select("*")
          .eq("department_id", id);

        if (coordError) {
          throw new Error(`Coordinators fetch error: ${coordError.message}`);
        }
        setCoordinators(coordData || []);
      } catch (error: any) {
        console.error("Error fetching department data:", error);
        setError(error.message || "Failed to load department data");
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to load department data",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchDepartmentData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {error || "Department not found"}
        </h1>
        <Button asChild>
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 animate-slide-up">
          {department.name}
        </h1>
        <p className="text-muted-foreground">
          Browse all events from the {department.name} department
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No events found for this department.
          </p>
          <Button asChild>
            <Link to="/">Browse Other Departments</Link>
          </Button>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {events.map((event) => (
              <Card
                key={event.id}
                className="animate-fade-in hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-2">{event.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {event.description || "No description available"}
                  </p>
                  {event.venue && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">Venue:</span> {event.venue}
                    </p>
                  )}
                  {event.date && (
                    <p className="text-sm mb-1">
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-primary font-bold">
                      ₹{event.registration_fee}
                    </span>
                    <span className="text-sm bg-secondary/10 text-secondary px-2 py-1 rounded">
                      Team Size: {event.team_size}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link to={`/events/${event.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4">Coordinators</h2>
        {coordinators.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No coordinators found for this department.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coordinators.map((coordinator) => (
              <Card
                key={coordinator.id}
                className="animate-fade-in hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-2">{coordinator.name}</h2>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Phone No:</span>{" "}
                    {coordinator.phone_number}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}