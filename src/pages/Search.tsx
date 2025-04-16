
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Event, Department } from "@/types";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [events, setEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedTeamSize, setSelectedTeamSize] = useState<string>("");

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const { data, error } = await supabase
          .from("departments")
          .select("*")
          .order("name");
        
        if (error) throw error;
        setDepartments(data || []);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    }
    
    fetchDepartments();
  }, []);

  useEffect(() => {
    async function searchEvents() {
      try {
        setIsLoading(true);
        
        // Start building query
        let query = supabase.from("events").select("*");
        
        // Apply search filter if query exists
        if (searchQuery) {
          query = query.ilike("title", `%${searchQuery}%`);
        }
        
        // Apply department filter
        if (selectedDepartment) {
          query = query.eq("department_id", selectedDepartment);
        }
        
        // Apply team size filter
        if (selectedTeamSize) {
          query = query.eq("team_size", parseInt(selectedTeamSize));
        }
        
        // Execute the query
        const { data, error } = await query.order("title");
        
        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error("Error searching events:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    searchEvents();
    
    // Update URL search params
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedDepartment) params.set("dept", selectedDepartment);
    if (selectedTeamSize) params.set("team", selectedTeamSize);
    setSearchParams(params);
    
  }, [searchQuery, selectedDepartment, selectedTeamSize]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is already handled by the useEffect
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search Events</h1>
        <p className="text-muted-foreground">
          Find events by name, department, or team size
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search events..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-departments">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={selectedTeamSize}
            onValueChange={setSelectedTeamSize}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Team Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any-size">Any Team Size</SelectItem>
              <SelectItem value="1">1 (Individual)</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
          
          <Button type="submit" className="md:w-auto">
            Search
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No events found matching your search criteria.</p>
          <Button onClick={() => {
            setSearchQuery("");
            setSelectedDepartment("");
            setSelectedTeamSize("");
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
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
      )}
    </div>
  );
}
