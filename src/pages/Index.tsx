import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types";
import DepartmentIcons from "@/components/DepartmentIcons";
import EventsCarousel from "@/components/EventsCarousel";
import LiveCounter from "@/components/LiveCounter";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Import Google Fonts via CSS
const fontImport = `
  @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@400;700&display=swap');
`;
const style = document.createElement("style");
style.textContent = fontImport;
document.head.appendChild(style);

export default function HomePage() {
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingEvents = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("is_trending", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTrendingEvents(data || []);
      } catch (error) {
        console.error("Error fetching trending events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingEvents();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1
          className="font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600"
          style={{
            fontFamily: "'Great Vibes', 'Dancing Script', cursive",
            letterSpacing: "2px",
            fontSize: "2.925rem",
            "@media (min-width: 768px)": {
              fontSize: "5.88rem",
            },
          }}
        >
          Sanchalana 2025
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-2xl mx-auto font-medium leading-relaxed">
          Mark Your Calendars! The Annual Techno-Cultural Fest at SVIT is Coming
          on May 9th & 10th
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            variant="outline"
            asChild
            className="hover:bg-primary hover:text-white transition-colors"
          >
            <Link to="/search">Browse Events</Link>
          </Button>
        </div>
      </section>

      {/* Two-column layout for Featured Events and Live Counter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Featured Events Section */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Featured Events</h2>
            <Button variant="ghost" asChild>
              <Link to="/search">View All</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : trendingEvents.length > 0 ? (
            <EventsCarousel events={trendingEvents} />
          ) : (
            <p className="text-center py-12 text-muted-foreground">
              No featured events available at the moment.
            </p>
          )}
        </div>

        {/* Live Counter Section */}
        <div className="lg:col-span-1 h-full">
          <LiveCounter />
        </div>
      </div>

      {/* Departments Section - Full Width */}
      <section className="w-full">
        <DepartmentIcons />
      </section>
    </div>
  );
}