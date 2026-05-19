import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Search as SearchIcon } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { getDepartmentData, type Event } from "@/utils/departmentDataUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { departmentConfig } from "@/config/departments";

interface SearchEvent extends Event {
  sourceDepartmentId: string;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [events, setEvents] = useState<SearchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredEvents, setFilteredEvents] = useState<SearchEvent[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllEvents = async () => {
      setLoading(true);
      try {
        const departmentIds = Object.keys(departmentConfig);
        let allEvents: SearchEvent[] = [];
        
        await Promise.all(departmentIds.map(async (deptId) => {
          try {
            const data = await getDepartmentData(deptId);
            if (data && data.events) {
              const eventsWithDept = data.events.map(event => ({
                ...event,
                sourceDepartmentId: deptId
              }));
              allEvents = [...allEvents, ...eventsWithDept];
            }
          } catch (error) {
            console.error(`Error fetching events for ${deptId}:`, error);
          }
        }));
        
        setEvents(allEvents);
      } catch (error) {
        console.error("Error fetching all events:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllEvents();
  }, []);

  useEffect(() => {
    const query = searchTerm.toLowerCase();
    
    const filtered = events.filter(event => {
      if (departmentFilter && event.sourceDepartmentId !== departmentFilter) {
        return false;
      }
      
      if (query) {
        return (
          event.event_name.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.department.toLowerCase().includes(query) ||
          event.event_type.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
    
    setFilteredEvents(filtered);
    
    if (searchTerm) {
      setSearchParams({ q: searchTerm });
    } else {
      setSearchParams({});
    }
  }, [searchTerm, departmentFilter, events, setSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="relative py-16 bg-purple-900/20">
        <div className="absolute inset-0 bg-grid-pattern-white/5 opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Search Events
          </h1>
          
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search for events by name, type, or department..."
                className="w-full p-4 pl-12 text-lg bg-white/10 border-white/20 placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400 rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <Button 
                type="button" 
                variant={!departmentFilter ? "default" : "outline"}
                className={!departmentFilter ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-800/50 border-white/20"}
                onClick={() => setDepartmentFilter(null)}
              >
                All Departments
              </Button>
              
              {Object.entries(departmentConfig).map(([id, dept]) => (
                <Button 
                  key={id}
                  type="button" 
                  variant={departmentFilter === id ? "default" : "outline"}
                  className={departmentFilter === id ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-800/50 border-white/20"}
                  onClick={() => setDepartmentFilter(id)}
                >
                  {dept.name}
                </Button>
              ))}
            </div>
          </form>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[320px] rounded-xl bg-gray-800/50" />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <>
            <h2 className="text-2xl font-semibold mb-6">
              {searchTerm ? `Search Results for "${searchTerm}"` : "All Events"}
              <span className="text-gray-400 ml-2">({filteredEvents.length} events found)</span>
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard
                  key={`${event.sourceDepartmentId}-${event.sl_no}`}
                  id={event.sl_no.toString()}
                  title={event.event_name}
                  date={event.date}
                  venue={event.venue}
                  teamSize={event.team_size}
                  fee={event.registration_fees}
                  departmentId={event.sourceDepartmentId}
                  description={event.description}
                  image={event.poster_url || undefined}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-gray-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No events found</h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              {searchTerm 
                ? `We couldn't find any events matching "${searchTerm}". Try adjusting your search or browse all events.` 
                : "There are no events in this department yet. Check back later or browse other departments."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
