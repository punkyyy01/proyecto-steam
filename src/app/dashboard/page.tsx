import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatsCards from "@/components/StatsCards";
import GameCard from "@/components/GameCard";
import SyncButton from "@/components/SyncButton";

interface GameData {
  appId: number;
  name: string;
  iconUrl: string | null;
  totalMinutes: number;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("steam_id")
    .eq("id", user.id)
    .single();

  let games: GameData[] = [];

  if (profile?.steam_id) {
    // Fetch snapshots and games in parallel
    const [snapshotsRes, gamesRes] = await Promise.all([
      supabase
        .from("playtime_snapshots")
        .select("app_id, total_minutes")
        .eq("user_id", user.id),
      supabase.from("games").select("app_id, name, icon_url"),
    ]);

    const gamesMap = new Map<number, { name: string; icon_url: string | null }>();
    gamesRes.data?.forEach((g) => gamesMap.set(g.app_id, g));

    // Deduplicate snapshots by app_id — keep highest total_minutes
    const deduped = new Map<number, number>();
    snapshotsRes.data?.forEach((s) => {
      const existing = deduped.get(s.app_id);
      if (!existing || s.total_minutes > existing) {
        deduped.set(s.app_id, s.total_minutes);
      }
    });

    games = Array.from(deduped.entries())
      .map(([appId, totalMinutes]) => ({
        appId,
        name: gamesMap.get(appId)?.name ?? `App ${appId}`,
        iconUrl: gamesMap.get(appId)?.icon_url ?? null,
        totalMinutes,
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  }

  const totalHours = games.reduce((sum, g) => sum + g.totalMinutes, 0) / 60;
  const mostPlayed = games[0]?.name ?? null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel de control</h1>
          <p className="text-muted text-sm mt-1">
            Tu resumen de actividad en Steam
          </p>
        </div>
        {profile?.steam_id && <SyncButton />}
      </div>

      {/* No Steam ID linked */}
      {!profile?.steam_id ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 10-16 0" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Configura tu Steam ID
          </h2>
          <p className="text-muted text-sm max-w-md mx-auto">
            Vincula tu cuenta de Steam para empezar a rastrear tus horas de juego.
          </p>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white
              font-medium text-sm rounded-lg transition-colors"
          >
            Ir al perfil
          </Link>
        </div>

      /* No games yet */
      ) : games.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.3" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Sin datos todavía
          </h2>
          <p className="text-muted text-sm max-w-md mx-auto">
            Usa el botón &quot;Sincronizar Steam&quot; para importar tus juegos y horas de juego.
          </p>
        </div>

      /* Dashboard with data */
      ) : (
        <>
          <StatsCards
            totalGames={games.length}
            totalHours={totalHours}
            mostPlayed={mostPlayed}
          />

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Tu biblioteca
              <span className="text-muted text-sm font-normal ml-2">
                {games.length} juegos
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {games.map((g) => (
                <GameCard key={g.appId} {...g} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
