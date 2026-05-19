
import { useNavigate } from "react-router-dom";

export interface EventCardProps {
  id: string;
  title: string;
  date: string;
  venue: string;
  teamSize?: number;
  fee: number;
  departmentId?: string;
  description?: string;
  image?: string;
}

export function EventCard({
  id,
  title,
  date,
  venue,
  teamSize,
  fee,
  departmentId,
  description,
}: EventCardProps) {
  const navigate = useNavigate();
  const eventUrl = departmentId ? `/events/${id}?department=${departmentId}` : `/events/${id}`;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    navigate(eventUrl);
  };

  return (
    <div
      className="group block rounded-lg bg-white/5 border border-white/10 p-4 hover:border-purple-500/50 transition-all min-h-[120px] flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 relative hover-scale animate-fade-in"
      tabIndex={0}
      role="button"
      aria-label={`View details for ${title}`}
      onClick={handleClick}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleClick(e as any); }}
    >
      <h3 className="text-base font-semibold text-white group-hover:text-purple-400 transition-colors">{title}</h3>
      <div className="flex flex-wrap gap-3 text-xs text-purple-300 my-1">
        <span>{date}</span>
        <span>{venue}</span>
        {teamSize !== undefined && <span>Team Size: {teamSize}</span>}
        <span className="ml-auto text-purple-400 font-semibold">₹{fee}</span>
      </div>
      {description && (
        <p className="text-xs text-gray-400 mt-2 line-clamp-2">{description}</p>
      )}
      <div className="text-right mt-2">
        <span className="inline-block rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-300 group-hover:bg-purple-500/30 transition-colors">
          View Details
        </span>
      </div>
    </div>
  );
}
