import { SupabaseClient } from "@supabase/supabase-js";
import { SteamGame } from "@/lib/steam/service";

/**
 * Hace upsert de los juegos en la tabla `games` y luego inserta
 * snapshots de tiempo en `playtime_snapshots`.
 *
 * @returns Cantidad de snapshots insertados exitosamente.
 */
export async function syncGamesToSupabase(
  supabase: SupabaseClient,
  userId: string,
  games: SteamGame[]
): Promise<{ inserted: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;

  // 1. Upsert de juegos en el catálogo (batch)
  const gamesPayload = games.map((g) => ({
    app_id: g.appid,
    name: g.name,
    icon_url: g.img_icon_url
      ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
      : null,
    last_updated: new Date().toISOString(),
  }));

  // Supabase permite upsert en batch — usamos onConflict para actualizar si ya existe
  const { error: gamesError } = await supabase
    .from("games")
    .upsert(gamesPayload, { onConflict: "app_id" });

  if (gamesError) {
    errors.push(`Error al insertar juegos: ${gamesError.message}`);
    return { inserted, errors };
  }

  // 2. Insertar snapshots de tiempo
  const snapshotsPayload = games.map((g) => ({
    user_id: userId,
    app_id: g.appid,
    total_minutes: g.playtime_forever,
    source: "api" as const,
  }));

  // Insertamos en batch. Si hay conflictos de unicidad (mismo día/fuente),
  // Supabase devolverá error para esas filas. Usamos ignoreDuplicates.
  const { error: snapError, count } = await supabase
    .from("playtime_snapshots")
    .insert(snapshotsPayload, { count: "exact" });

  if (snapError) {
    // El código 23505 es "unique_violation" en PostgreSQL — significa duplicado
    if (snapError.code === "23505") {
      errors.push("Algunos snapshots ya existían para hoy y fueron ignorados.");
    } else {
      errors.push(`Error al insertar snapshots: ${snapError.message}`);
      return { inserted, errors };
    }
  }

  inserted = count ?? games.length;

  return { inserted, errors };
}
