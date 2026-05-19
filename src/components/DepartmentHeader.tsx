
import { cn } from "@/lib/utils";
import { departmentConfig } from "@/config/departments";

interface DepartmentHeaderProps {
  departmentId: string;
  description: string;
}

export function DepartmentHeader({ departmentId, description }: DepartmentHeaderProps) {
  const dept = departmentConfig[departmentId as keyof typeof departmentConfig] || {
    name: departmentId.toUpperCase(),
    bgColor: '#4285F4',
    icon: () => null
  };
  
  // If the department isn't found in config, use a default
  const DeptIcon = dept.icon || (() => null);
  const bgColorClass = getBgColorClass(dept.bgColor);

  return (
    <div className="relative w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-transparent opacity-80" />
      <div className="absolute inset-0" style={{ 
        background: `radial-gradient(circle at 30% 50%, ${dept.bgColor}40 0%, transparent 50%)` 
      }} />
      <div className="relative px-6 py-16 md:px-8 lg:py-24 container mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
          <div 
            className="flex h-24 w-24 md:h-32 md:w-32 items-center justify-center rounded-2xl md:rounded-3xl shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            style={{ backgroundColor: dept.bgColor }}
          >
            <DeptIcon className="h-12 w-12 md:h-16 md:w-16 text-white" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold md:text-5xl lg:text-6xl text-white drop-shadow-lg">
              {dept.name}
            </h1>
            <div className="w-20 h-1 bg-purple-500 rounded mx-auto md:mx-0 my-4"></div>
            <p className="mt-3 text-gray-200 md:text-lg max-w-2xl drop-shadow-md">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get appropriate Tailwind background classes
function getBgColorClass(hexColor: string): string {
  // Map of hex colors to Tailwind color classes
  const colorMap: Record<string, string> = {
    '#4285F4': 'bg-blue-600',
    '#EA4335': 'bg-red-600',
    '#34A853': 'bg-green-600',
    '#A142F4': 'bg-purple-600',
    '#00BCD4': 'bg-cyan-600',
    '#9E9E9E': 'bg-gray-600',
    '#F44336': 'bg-red-600',
    '#8667F2': 'bg-indigo-600',
    '#00C853': 'bg-emerald-600',
    '#2196F3': 'bg-blue-600',
    '#FFC107': 'bg-yellow-600',
  };
  
  return colorMap[hexColor] || 'bg-purple-600';
}
