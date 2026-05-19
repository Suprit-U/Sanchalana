import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DepartmentHeader } from "@/components/DepartmentHeader";
import { getDepartmentData, type DepartmentData } from "@/utils/departmentDataUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { EventCard } from "@/components/EventCard";
import { CoordinatorCard } from "@/components/CoordinatorCard";

export default function Department() {
  const { id } = useParams();
  const [departmentData, setDepartmentData] = useState<DepartmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        setLoading(true);
        try {
          const data = await getDepartmentData(id);
          setDepartmentData(data);

          if (!data) {
            toast({
              title: "Department Not Found",
              description: `Could not load data for department: ${id}`,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching department data:", error);
          toast({
            title: "Error Loading Department",
            description: "There was an error loading the department data. Please try again later.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="animate-pulse h-64 bg-gray-800"></div>
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col gap-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[90px] rounded-xl bg-gray-800" />
              ))}
            </div>
            <Skeleton className="h-32 rounded-xl bg-gray-800" />
            <Skeleton className="h-64 rounded-xl bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!departmentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Department Not Found</h1>
          <p className="text-gray-300 max-w-md">
            The department you are looking for doesn't exist or hasn't been added yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <DepartmentHeader
        departmentId={id || ""}
        description={`Explore exciting events and competitions from the ${departmentData.department} department. Register now to showcase your talents and win amazing prizes.`}
      />
      <div className="container mx-auto px-4 pb-16">
        <section className="animate-fade-in mt-12">
          <div className="border-l-4 border-purple-500 pl-4">
            <h2 className="text-3xl font-bold mb-2 text-white">Events</h2>
            <p className="text-gray-300 mb-8">Register and participate in our exciting events</p>
          </div>
          {departmentData.events && departmentData.events.length > 0 ? (
            <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {departmentData.events.map((event) => (
                <EventCard
                  key={event.sl_no}
                  id={event.sl_no.toString()}
                  title={event.event_name}
                  date={event.date}
                  venue={event.venue}
                  teamSize={event.team_size}
                  fee={event.registration_fees}
                  departmentId={id}
                  description={event.description}
                  image={undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>No events found for this department.</p>
            </div>
          )}
        </section>
        <section className="animate-fade-in mt-20">
          <div className="border-l-4 border-purple-500 pl-4">
            <h2 className="text-3xl font-bold mb-2 text-white">Department Coordinators</h2>
            <p className="text-gray-300 mb-8">Get in touch with our coordinators for any queries</p>
          </div>
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-4 text-gray-200">Faculty Coordinators</h3>
            {departmentData.faculty_coordinators && departmentData.faculty_coordinators.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {departmentData.faculty_coordinators.map((coordinator, index) => (
                  <div
                    key={index}
                    className="rounded-lg bg-white/5 px-4 py-4 border border-white/10 flex flex-col gap-2 justify-between"
                  >
                    <span className="font-semibold text-white">{coordinator}</span>
                    {/* No phone numbers available for faculty coordinators (string) */}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-400">No faculty coordinators found.</p>
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-200">Student Coordinators</h3>
            {departmentData.main_department_coordinators && departmentData.main_department_coordinators.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {departmentData.main_department_coordinators.map((coordinator) => (
                  <CoordinatorCard
                    key={coordinator.usn}
                    name={coordinator.student_name}
                    phone={coordinator.mobile_number}
                    role={`${coordinator.semester} Sem Section ${coordinator.section}`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-400">No student coordinators found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
