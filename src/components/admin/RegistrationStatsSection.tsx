
import { Users } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface RegistrationStats {
  total: number;
  departmentBreakdown: {
    department: string;
    count: number;
    percent: number;
  }[];
}

interface RegistrationStatsSectionProps {
  stats: RegistrationStats | null;
  isError?: boolean;
}

export function RegistrationStatsSection({ stats, isError }: RegistrationStatsSectionProps) {
  if (!stats) {
    if (isError) {
      return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl">
          <Alert variant="destructive" className="bg-red-900/30 border-red-500/30 text-white">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertTitle>Error loading registration data</AlertTitle>
            <AlertDescription>
              Could not load registration statistics. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
          <Users className="h-6 w-6 text-purple-400" />
        </div>
        <h2 className="text-xl font-semibold">Registration Statistics</h2>
      </div>
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-medium text-purple-300 mb-2">Department-wise Registration</h3>
        <div className="space-y-3">
          {stats.departmentBreakdown.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{item.department}</span>
                <span>{item.count.toLocaleString()} ({item.percent}%)</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${item.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
