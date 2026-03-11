// Tipos para la respuesta de la API de Steam

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number; // minutos totales
  playtime_2weeks?: number; // minutos últimas 2 semanas
  img_icon_url: string;
}

interface SteamOwnedGamesResponse {
  response: {
    game_count: number;
    games: SteamGame[];
  };
}

/**
 * Obtiene la lista de juegos de un usuario de Steam usando la API oficial.
 * SOLO debe llamarse desde el servidor (Server Actions / Route Handlers).
 */
export async function fetchSteamGames(steamId: string): Promise<SteamGame[]> {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) {
    throw new Error("STEAM_API_KEY no está configurada en las variables de entorno.");
  }

  const url = new URL("http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamid", steamId);
  url.searchParams.set("format", "json");
  url.searchParams.set("include_appinfo", "1");

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Error de la API de Steam: ${res.status} ${res.statusText}`);
  }

  const data: SteamOwnedGamesResponse = await res.json();

  if (!data.response?.games) {
    throw new Error(
      "No se pudieron obtener los juegos. El perfil puede ser privado o el SteamID es inválido."
    );
  }

  return data.response.games;
}
