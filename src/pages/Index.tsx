import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DepartmentCircle } from "@/components/DepartmentCircle";
import { departmentConfig } from "@/config/departments";
import { Button } from "@/components/ui/button";
import { getRegistrationCount } from "@/utils/storageUtils";
import { getDepartmentData } from "@/utils/departmentDataUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ensureStorageBucketsExist } from "@/utils/storageUtils";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const isMobile = useIsMobile();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [departmentEvents, setDepartmentEvents] = useState<any[]>([]);
  const [countdownDays, setCountdownDays] = useState(0);
  const [countdownHours, setCountdownHours] = useState(0);
  const [countdownMinutes, setCountdownMinutes] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const navigate = useNavigate();
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const targetDate = new Date('2025-05-09T00:00:00');
    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      if (difference > 0) {
        setCountdownDays(Math.floor(difference / (1000 * 60 * 60 * 24)));
        setCountdownHours(Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
        setCountdownMinutes(Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)));
        setCountdownSeconds(Math.floor((difference % (1000 * 60)) / 1000));
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchRegistrationCount = async () => {
      setIsLoadingCount(true);
      try {
        await ensureStorageBucketsExist();
        const count = await getRegistrationCount();
        console.log("Retrieved registration count:", count);
        setRegistrationCount(count);
      } catch (error) {
        console.error("Error fetching registration count:", error);
        toast({
          title: "Error",
          description: "Could not load registration count. Please try refreshing.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCount(false);
      }
    };

    fetchRegistrationCount();
    const interval = setInterval(fetchRegistrationCount, 15000);
    return () => clearInterval(interval);
  }, [toast]);

  const forceRefreshCount = async () => {
    setIsLoadingCount(true);
    try {
      await ensureStorageBucketsExist();
      const count = await getRegistrationCount();
      console.log("Force refreshed registration count:", count);
      setRegistrationCount(count);
      toast({
        title: "Refreshed",
        description: "Registration count updated",
      });
    } catch (error) {
      console.error("Error refreshing count:", error);
    } finally {
      setIsLoadingCount(false);
    }
  };

  useEffect(() => {
    const loadFeaturedEvents = async () => {
      const departments = Object.keys(departmentConfig);
      let allEvents: any[] = [];
      for (const dept of departments) {
        try {
          const data = await getDepartmentData(dept);
          if (data?.events) {
            allEvents.push(
              ...data.events
                .filter(event => event.featured)
                .map(event => ({
                  id: event.sl_no.toString(),
                  title: event.event_name,
                  date: event.date,
                  venue: event.venue,
                  department: data.department,
                  fee: event.registration_fees,
                  teamSize: event.team_size || 1,
                  departmentId: dept,
                }))
            );
          }
        } catch (error) {
        }
      }
      setFeaturedEvents(allEvents.slice(0, 8));
    };
    loadFeaturedEvents();
  }, []);

  const handleBrowseEvents = () => {
    navigate('/search');
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (!featuredEvents.length) return;
    if (direction === "left") {
      setCurrentFeaturedIndex((prev) =>
        prev >= featuredEvents.length - 1 ? 0 : prev + 1
      );
    } else {
      setCurrentFeaturedIndex((prev) =>
        prev === 0 ? featuredEvents.length - 1 : prev - 1
      );
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handleSwipe("right");
      if (e.key === "ArrowRight") handleSwipe("left");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [featuredEvents.length]);

  const carouselTouchStartRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    carouselTouchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (carouselTouchStartRef.current === null) return;
    const diff = e.changedTouches[0].clientX - carouselTouchStartRef.current;
    if (diff > 40) handleSwipe("right");
    if (diff < -40) handleSwipe("left");
    carouselTouchStartRef.current = null;
  };

  const handleDepartmentIconClick = (deptId: string) => {
    navigate(`/departments/${deptId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white pb-8 sm:pb-12">
      <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-10 flex flex-col items-center animate-fade-in gap-2 sm:gap-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-center text-gradient-primary mb-1">
          Sanchalana 2025
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-2xl font-medium text-center text-white/80 mb-3 sm:mb-4 md:mb-6 px-2">
          Mark Your Calendars! The Annual Techno-Cultural Fest at SVIT is Coming on May 9th &amp; 10th.
        </p>
        <div className="flex justify-center gap-1.5 sm:gap-2 md:gap-3 mb-3 animate-fade-in">
          {[
            { value: countdownDays, label: "Days" },
            { value: countdownHours, label: "Hours" },
            { value: countdownMinutes, label: "Minutes" },
            { value: countdownSeconds, label: "Seconds" },
          ].map((item) => (
            <div
              key={item.label}
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 bg-purple-600/20 border border-purple-400/25 rounded-lg shadow flex flex-col items-center justify-center animate-scale-in"
            >
              <span className="text-base sm:text-lg md:text-2xl font-extrabold text-purple-300">{item.value}</span>
              <span className="text-[8px] sm:text-[10px] md:text-xs text-white/70">{item.label}</span>
            </div>
          ))}
        </div>
        <Button
          className="block mt-2 sm:mt-3 text-xs sm:text-sm md:text-base bg-gradient-to-r w-40 sm:w-48 md:w-56 mx-auto from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg py-2 sm:py-3 px-2 hover:scale-105 hover:shadow-xl animate-scale-in"
          onClick={handleBrowseEvents}
        >
          Browse Events
        </Button>
      </section>

      <section className="container mx-auto px-2 sm:px-3 py-4 sm:py-6 md:py-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto">
          <div
            className="flex-1 min-w-[280px] sm:min-w-[300px] px-0 py-0 bg-gradient-to-br from-purple-700/30 to-pink-500/10 border border-purple-600/10 rounded-2xl shadow-lg flex flex-col justify-between items-center relative h-[280px] sm:h-[300px] overflow-hidden"
            tabIndex={0}
            aria-roledescription="carousel"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <h2 className="text-base sm:text-lg font-bold mt-3 sm:mt-4 text-purple-200 px-4 self-start">
              Featured Events
            </h2>
            {featuredEvents.length > 0 ? (
              <div className="relative w-full flex flex-col items-center select-none h-full">
                <div className="w-full flex flex-col items-center py-2 sm:py-3 transition-all duration-300 h-full px-3 sm:px-4">
                  <div className="rounded-xl bg-purple-950/90 border border-purple-700/60 p-3 sm:p-4 md:p-6 flex flex-col gap-2 items-start min-h-[160px] sm:min-h-[180px] w-full mx-auto justify-between shadow-lg animate-fade-in">
                    <div className="font-bold text-base sm:text-lg md:text-2xl text-purple-100 mb-1 sm:mb-2 line-clamp-2">
                      {featuredEvents[currentFeaturedIndex].title}
                    </div>
                    <div className="text-purple-200 text-xs sm:text-sm flex flex-row items-center gap-2 sm:gap-3 flex-wrap">
                      <span className="font-medium">{featuredEvents[currentFeaturedIndex].date}</span>
                      <span className="hidden sm:inline">&middot;</span>
                      <span className="font-medium">{featuredEvents[currentFeaturedIndex].venue}</span>
                    </div>
                    <div className="text-[10px] sm:text-xs text-purple-300 mb-1 sm:mb-2">
                      {featuredEvents[currentFeaturedIndex].department}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full">
                      <span className="inline-block text-[10px] sm:text-xs bg-purple-700/60 text-purple-200 px-2 py-1 rounded-lg font-semibold select-none">
                        ₹{featuredEvents[currentFeaturedIndex].fee}
                      </span>
                      <Button
                        size="sm"
                        className="ml-auto px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded font-bold hover:scale-105 text-[10px] sm:text-xs"
                        onClick={() =>
                          navigate(
                            `/events/${featuredEvents[currentFeaturedIndex].id}?department=${featuredEvents[currentFeaturedIndex].departmentId}`
                          )
                        }
                      >
                        <svg
                          className="h-3 w-3 sm:h-4 sm:w-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 12h14"></path>
                          <path d="M12 5l7 7-7 7"></path>
                        </svg>
                        View Event
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-1/2 left-1 sm:left-2 -translate-y-1/2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleSwipe("right")} 
                    className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-purple-800/40 border-purple-600/30"
                    aria-label="Previous Event"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                <div className="absolute top-1/2 right-1 sm:right-2 -translate-y-1/2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleSwipe("left")}
                    className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-purple-800/40 border-purple-600/30"
                    aria-label="Next Event"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-1 sm:gap-1.5 mt-auto mb-2 sm:mb-3 justify-center">
                  {featuredEvents.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentFeaturedIndex(i)}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border ${
                        i === currentFeaturedIndex
                          ? "bg-purple-500 border-purple-300 scale-110"
                          : "bg-purple-300/30 border-purple-500/20"
                      } transition-[background,transform] duration-150`}
                      aria-label={`Go to featured event ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 p-4 sm:p-6 animate-fade-in">No featured events to show.</div>
            )}
          </div>

          <div className="flex-1 max-w-full sm:max-w-xs h-[220px] sm:h-[250px] md:h-[300px] px-3 sm:px-4 py-3 sm:py-4 bg-white/10 border border-purple-400/20 rounded-2xl flex flex-col items-center justify-center shadow-lg">
            <h3 className="text-base sm:text-lg font-medium text-white mb-1 sm:mb-2 mt-1 sm:mt-2 text-center animate-fade-in">
              Live Registrations
            </h3>
            <div onClick={forceRefreshCount} className="cursor-pointer group">
              {isLoadingCount ? (
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-purple-500 my-3 sm:my-4"></div>
              ) : (
                <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-gradient-primary my-1 sm:my-2 group-hover:scale-105 transition-transform">
                  {registrationCount.toLocaleString()}
                </div>
              )}
            </div>
            <p className="text-xs sm:text-sm text-purple-100/70 mb-0.5 sm:mb-1">Total registrations so far</p>
            <p className="text-[10px] sm:text-xs text-purple-100/50 mb-2">(Click to refresh)</p>
            <Button
              variant="outline"
              className="w-24 sm:w-28 md:w-32 mt-1 sm:mt-2 border-purple-300 text-purple-300 bg-white/10 hover:bg-purple-600/20 hover:text-white text-xs sm:text-sm font-semibold"
              onClick={handleBrowseEvents}
            >
              Browse Events
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 animate-fade-in">
        <h2 className="text-lg sm:text-xl md:text-3xl font-bold text-center mb-4 sm:mb-6 md:mb-8 text-gradient-primary">
          Explore Departments
        </h2>
        <div className="max-w-5xl mx-auto mb-6 sm:mb-8 flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-6">
          {Object.entries(departmentConfig).map(([id, dept]) => (
            <div
              key={id}
              tabIndex={0}
              className="cursor-pointer transform hover:scale-105 transition-transform duration-200"
              onClick={() => handleDepartmentIconClick(id)}
              role="button"
              aria-label={dept.name}
            >
              <DepartmentCircle id={id} name={dept.name} Icon={dept.icon} bgColor={dept.bgColor} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
