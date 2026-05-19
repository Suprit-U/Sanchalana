
interface CoordinatorCardProps {
  name: string;
  phone: string;
  role?: string;
}

export function CoordinatorCard({ name, phone, role }: CoordinatorCardProps) {
  return (
    <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 transition-all duration-300 hover:bg-white/10 hover:border-purple-500/30 hover:shadow-[0_0_15px_rgba(147,51,234,0.2)]">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
          <span className="text-xl font-semibold text-purple-400">
            {name.charAt(0)}
          </span>
        </div>
        <div>
          <h4 className="font-semibold text-white">{name}</h4>
          {role && <p className="text-sm text-gray-400">{role}</p>}
          {phone && (
            <a 
              href={`tel:${phone}`}
              className="mt-1 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
