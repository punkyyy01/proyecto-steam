interface StatsCardsProps {
  totalGames: number;
  totalHours: number;
  mostPlayed: string | null;
}

export default function StatsCards({ totalGames, totalHours, mostPlayed }: StatsCardsProps) {
  const stats = [
    {
      label: "Total juegos",
      value: totalGames.toString(),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M12 12h.01M6 12h4M8 10v4" />
        </svg>
      ),
    },
    {
      label: "Horas jugadas",
      value: totalHours.toLocaleString("es-ES", { maximumFractionDigits: 1 }),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "Más jugado",
      value: mostPlayed ?? "—",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 8 12 8s5-4 7.5-4a2.5 2.5 0 010 5H18" />
          <path d="M18 15h1.5a2.5 2.5 0 010 5C17 20 17 16 12 16s-5 4-7.5 4a2.5 2.5 0 010-5H6" />
          <line x1="6" y1="9" x2="6" y2="15" />
          <line x1="18" y1="9" x2="18" y2="15" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-card border border-border rounded-xl p-5 flex items-start gap-4"
        >
          <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
            {s.icon}
          </div>
          <div className="min-w-0">
            <p className="text-muted text-xs uppercase tracking-wider font-medium">
              {s.label}
            </p>
            <p className="text-foreground text-xl font-bold mt-0.5 truncate">
              {s.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
