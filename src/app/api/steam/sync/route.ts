import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchSteamGames } from "@/lib/steam/service";
import { syncGamesToSupabase } from "@/lib/supabase/sync";

export async function POST() {
  try {
    const supabase = await createClient();

    // 1. Verificar que el usuario está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado. Inicia sesión primero." },
        { status: 401 }
      );
    }

    // 2. Obtener el steam_id del perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("steam_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.steam_id) {
      return NextResponse.json(
        { error: "No se encontró un SteamID vinculado a tu perfil." },
        { status: 404 }
      );
    }

    // 3. Llamar a la API de Steam (server-side)
    const games = await fetchSteamGames(profile.steam_id);

    // 4. Sincronizar con Supabase
    const result = await syncGamesToSupabase(supabase, user.id, games);

    return NextResponse.json({
      success: true,
      games_found: games.length,
      snapshots_inserted: result.inserted,
      warnings: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[/api/steam/sync] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
