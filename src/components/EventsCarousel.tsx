import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Event } from "@/types";
import { ChevronLeft, ChevronRight, Clock, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
interface EventsCarouselProps {
  events: Event[];
}
export default function EventsCarousel({
  events
}: EventsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Set up auto-play functionality
  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [currentIndex, events.length]);
  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayRef.current = setInterval(() => {
      next();
    }, 5000); // Advance every 5 seconds
  };
  const stopAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  };
  const next = () => {
    if (events.length <= 1) return;
    setCurrentIndex(prevIndex => (prevIndex + 1) % events.length);
  };
  const prev = () => {
    if (events.length <= 1) return;
    setCurrentIndex(prevIndex => (prevIndex - 1 + events.length) % events.length);
  };

  // If no events are available
  if (events.length === 0) {
    return <div className="p-8 text-center">
        <h3 className="text-lg font-medium">No featured events available</h3>
      </div>;
  }
  const currentEvent = events[currentIndex];

  // Find department name based on department_id
  const getDepartmentName = (departmentId: string): string => {
    // This would ideally come from a departments context or prop
    // For now, returning a placeholder based on the event name
    return currentEvent.title.includes("Quiz") ? "ISE" : "CSE";
  };
  return <div className="relative w-full overflow-hidden rounded-lg">
      <div className="overflow-hidden bg-black rounded-xl">
        <div className="relative h-[400px]">
          {/* Background image */}
          {currentEvent.image_url && <div className="absolute inset-0 w-full h-full">
              <img src={currentEvent.image_url} alt={currentEvent.title} className="w-full h-full object-cover opacity-80" />
              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
            </div>}
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
            <div className="mb-2 text-sm">
              
            </div>
            <h2 className="text-4xl font-bold mb-2">{currentEvent.title}</h2>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Group, {currentEvent.team_size} members</span>
              </div>
              
            </div>
            
            <div className="flex justify-between items-center">
              <Link to={`/events/${currentEvent.id}`} className="group">
                <div className="mt-2 flex items-center text-white hover:text-primary transition-colors">
                  <span className="underline underline-offset-4">View Event</span>
                  <ChevronRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <div className="text-xl font-bold">
                ₹{currentEvent.registration_fee}
              </div>
            </div>
          </div>
          
          {/* Navigation arrows */}
          {events.length > 1 && <>
              <Button onClick={prev} variant="outline" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full shadow-lg z-10 opacity-70 hover:opacity-100" onMouseEnter={stopAutoPlay} onMouseLeave={startAutoPlay}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button onClick={next} variant="outline" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full shadow-lg z-10 opacity-70 hover:opacity-100" onMouseEnter={stopAutoPlay} onMouseLeave={startAutoPlay}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>}
        </div>
      </div>
      
      {/* Indicator dots */}
      {events.length > 1 && <div className="flex justify-center mt-4 gap-1">
          {events.map((_, index) => <button key={index} className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "bg-primary w-4" : "bg-primary/30"}`} onClick={() => setCurrentIndex(index)} onMouseEnter={stopAutoPlay} onMouseLeave={startAutoPlay} />)}
        </div>}
    </div>;
}