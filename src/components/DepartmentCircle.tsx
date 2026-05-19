
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DepartmentCircleProps {
  id: string;
  name: string;
  Icon: LucideIcon;
  bgColor: string;
}

export function DepartmentCircle({ id, name, Icon, bgColor }: DepartmentCircleProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`department_error_${id}`);
    }
    navigate(`/departments/${id}`);
    window.scrollTo(0, 0);
  };

  return (
    <a
      href={`/departments/${id}`}
      className="group flex flex-col items-center justify-between transition-all duration-300 hover:scale-110 focus:scale-110 w-24 sm:w-28 md:w-32 mb-6 outline-none"
      aria-label={`View ${name} department`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick(e);
      }}
      tabIndex={0}
      role="button"
    >
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 shadow-lg border-4 border-purple-400/40 bg-gradient-to-br from-purple-800/80 to-purple-600/70 transition-all duration-300 group-hover:shadow-2xl"
        style={{ backgroundColor: bgColor }}
      >
        <Icon className="h-8 w-8 sm:h-9 sm:w-9 text-white drop-shadow-xl" />
      </div>
      <span className="text-xs sm:text-sm font-medium text-center text-gray-100 group-hover:text-purple-300 transition-colors line-clamp-2 h-9 sm:h-10">
        {name}
      </span>
    </a>
  );
}
