import Image from "next/image";

interface GameCardProps {
  appId: number;
  name: string;
  iconUrl: string | null;
  totalMinutes: number;
}

export default function GameCard({ name, iconUrl, totalMinutes }: GameCardProps) {
  const hours = totalMinutes / 60;
  const display =
    hours >= 1
      ? `${hours.toFixed(1)} h`
      : `${totalMinutes} min`;

  return (
    <div className="group flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:bg-card-hover hover:border-primary/30 transition-all">
      {iconUrl ? (
        <Image
          src={iconUrl}
          alt={name}
          width={40}
          height={40}
          className="rounded-lg shrink-0"
          unoptimized
        />
      ) : (
        <div className="w-10 h-10 bg-border rounded-lg flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M12 12h.01" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-medium text-sm truncate group-hover:text-primary transition-colors">
          {name}
        </p>
        <p className="text-muted text-xs mt-0.5">{display}</p>
      </div>
    </div>
  );
}
