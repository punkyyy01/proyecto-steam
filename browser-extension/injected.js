/**
 * injected.js — se ejecuta en el contexto de la PÁGINA (world: MAIN).
 *
 * Accede a la variable global `rgGames` que Steam embebe en la página de
 * juegos del perfil (steamcommunity.com/id/USER/games).
 * Serializa los datos y los pasa al content_script mediante postMessage.
 */
(function () {
  // ── Parsear "1,234.5 hrs" o "1,234.5" → minutos ───────────────────────
  function parseHoursToMinutes(raw) {
    if (!raw) return 0;
    // Eliminar separadores de miles y texto no numérico ("hrs", "h", etc.)
    const cleaned = String(raw).replace(/,/g, "").replace(/[^\d.]/g, "");
    const hours = parseFloat(cleaned);
    return isNaN(hours) ? 0 : Math.round(hours * 60);
  }

  // ── Buscar rgGames en el scope de la página ────────────────────────────
  if (typeof rgGames === "undefined" || !Array.isArray(rgGames)) {
    window.postMessage(
      { source: "ARCHAEOLOGIST", type: "NO_DATA", reason: "rgGames_not_found" },
      "*"
    );
    return;
  }

  if (rgGames.length === 0) {
    window.postMessage(
      { source: "ARCHAEOLOGIST", type: "NO_DATA", reason: "rgGames_empty" },
      "*"
    );
    return;
  }

  // ── Mapear al formato que necesita Supabase ────────────────────────────
  const games = rgGames
    .filter((g) => g.appid)
    .map((g) => ({
      appid: Number(g.appid),
      name: g.name || `App ${g.appid}`,
      // logo: URL completa de imagen, ya viene como string en rgGames
      logo: g.logo || null,
      total_minutes: parseHoursToMinutes(g.hours_forever),
      recent_minutes: parseHoursToMinutes(g.hours), // últimas 2 semanas
    }));

  window.postMessage(
    { source: "ARCHAEOLOGIST", type: "GAMES_DATA", games },
    "*"
  );
})();
