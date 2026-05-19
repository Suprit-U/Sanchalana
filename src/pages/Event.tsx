import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Ticket } from "lucide-react";
import { CoordinatorCard } from "@/components/CoordinatorCard";
import { getDepartmentData, type Event as EventType } from "@/utils/departmentDataUtils";
import { Skeleton } from "@/components/ui/skeleton";

const REGISTRATION_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSf4Y3KLDhXpf_DB5DtGdVUukEcu2tk4ja-Dt9znOprgdXE_gA/viewform";

export default function Event() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      const deptFromUrl = searchParams.get('department');
      
      if (deptFromUrl && id) {
        try {
          const data = await getDepartmentData(deptFromUrl);
          if (data) {
            const foundEvent = data.events.find(e => e.sl_no.toString() === id);
            if (foundEvent) {
              setEvent(foundEvent);
              setDepartmentId(deptFromUrl);
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching event from URL department:", error);
        }
      }
      
      const departmentIds = ['aiml', 'cse', 'ece', 'ise', 'civil', 'math', 'mba', 'chem', 'phy', 'svfc', 'ds'];
      
      for (const deptId of departmentIds) {
        try {
          const data = await getDepartmentData(deptId);
          if (data && id) {
            const foundEvent = data.events.find(e => e.sl_no.toString() === id);
            if (foundEvent) {
              setEvent(foundEvent);
              setDepartmentId(deptId);
              break;
            }
          }
        } catch (error) {
          console.error(`Error fetching event from ${deptId}:`, error);
        }
      }
      
      setLoading(false);
    };
    
    fetchEvent();
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="animate-pulse h-[400px] bg-gray-800"></div>
        <div className="container mx-auto px-4 -mt-12">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="h-96 rounded-xl mb-8 bg-gray-800 animate-pulse" />
              <div className="h-64 rounded-xl bg-gray-800 animate-pulse" />
            </div>
            <div className="h-96 rounded-xl bg-gray-800 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Event Not Found</h1>
          <p className="text-gray-300 max-w-md">
            The event you are looking for doesn't exist or hasn't been added yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="w-full lg:max-w-sm flex-shrink-0 flex flex-col items-center lg:items-start">
            <div className="rounded-2xl overflow-hidden shadow-xl bg-white/5 border border-white/10 mb-6 w-full">
              <img
                src={event.poster_url || "/lovable-uploads/840c62b1-64dd-48d0-844c-7c0119ecad6e.png"}
                alt={event.event_name}
                className="w-full h-auto object-contain max-h-[520px] aspect-[4/6] mx-auto"
                style={{ aspectRatio: "4/6" }}
              />
            </div>
            <div className="w-full text-center lg:text-left">
              <p className="text-gray-400">Registration Fee</p>
              <p className="text-2xl font-bold text-purple-400 mb-2">₹{event.registration_fees}</p>
              <button
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white flex items-center justify-center gap-2 py-2 rounded-lg mt-2"
                onClick={() => window.open("https://docs.google.com/forms/d/e/1FAIpQLSf4Y3KLDhXpf_DB5DtGdVUukEcu2tk4ja-Dt9znOprgdXE_gA/viewform", '_blank')}
              >
                Register Now
              </button>
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-6">
              <span className="bg-purple-600 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white mr-2">
                {event.event_type} • {event.department}
              </span>
              <h1 className="text-3xl font-bold md:text-4xl text-white drop-shadow-lg mt-2">{event.event_name}</h1>
              <div className="mt-4 flex flex-wrap gap-6 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-400" />
                  <span>{event.venue}</span>
                </div>
                {event.team_size !== undefined && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-400" />
                    <span>Team Size: {event.team_size}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-2">Description</h2>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 text-gray-300">
                {event.description || `Join us for ${event.event_name}, an exciting event from ${event.department} department!`}
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-xl font-bold text-white mb-2">Rules & Guidelines</h2>
              <ul className="space-y-2 text-gray-300">
                {event.rules_and_regulations.map((rule, index) => (
                  <li key={index} className="flex items-start bg-white/5 rounded px-3 py-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-sm mr-2 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-purple-300">Event Coordinators</h3>
              <div className="space-y-3">
                {event.faculty_coordinators &&
                  event.faculty_coordinators.map((coordinator, index) => (
                    <div key={`faculty-${index}-${coordinator.phone}`} className="flex flex-col md:flex-row gap-1 md:gap-2">
                      <span className="font-medium text-white">{coordinator.name}</span>
                      {coordinator.phone ? (
                        <a className="text-gray-400 underline" href={`tel:${coordinator.phone}`}>{coordinator.phone}</a>
                      ) : null}
                    </div>
                  ))}
                {event.student_coordinators &&
                  event.student_coordinators.map((coordinator, index) => (
                    <div key={`student-${index}-${coordinator.phone}`} className="flex flex-col md:flex-row gap-1 md:gap-2">
                      <span className="font-medium text-white">{coordinator.name}</span>
                      {coordinator.phone ? (
                        <a className="text-gray-400 underline" href={`tel:${coordinator.phone}`}>{coordinator.phone}</a>
                      ) : null}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
