/**
 * background.js — Service Worker (Manifest V3).
 *
 * Gestiona:
 *  - Autenticación con Supabase (login / logout / estado de sesión).
 *  - Inserción de datos en Supabase cuando el content_script detecta juegos.
 *  - Deduplicación mediante UPSERT (games) e IGNORE-DUPLICATES (snapshots),
 *    igual que sync.ts del proyecto principal.
 */

const STORAGE = {
  SESSION: "supabase_session",
  CONFIG: "extension_config",
};

// ═══════════════════════════════════════════════════════════
// Storage helpers
// ═══════════════════════════════════════════════════════════

async function getSession() {
  const r = await chrome.storage.local.get(STORAGE.SESSION);
  return r[STORAGE.SESSION] ?? null;
}

async function saveSession(session) {
  await chrome.storage.local.set({ [STORAGE.SESSION]: session });
}

async function clearSession() {
  await chrome.storage.local.remove(STORAGE.SESSION);
}

async function getConfig() {
  const r = await chrome.storage.local.get(STORAGE.CONFIG);
  return r[STORAGE.CONFIG] ?? {};
}

async function saveConfig(config) {
  await chrome.storage.local.set({ [STORAGE.CONFIG]: config });
}

// ═══════════════════════════════════════════════════════════
// Supabase REST helpers
// ═══════════════════════════════════════════════════════════

/**
 * Login con email/password.
 * Endpoint: POST /auth/v1/token?grant_type=password
 */
async function supabaseLogin(supabaseUrl, supabaseKey, email, password) {
  const res = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
      },
      body: JSON.stringify({ email, password }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.msg || "Login fallido");
  }
  return data; // { access_token, refresh_token, user, expires_in, ... }
}

/**
 * Logout — invalida el token en Supabase.
 */
async function supabaseLogout(supabaseUrl, supabaseKey, accessToken) {
  await fetch(`${supabaseUrl}/auth/v1/logout`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${accessToken}`,
    },
  }).catch(() => {}); // fallo silencioso — igual limpiamos storage
}

/**
 * Headers base para llamadas a la REST API de Supabase.
 */
function restHeaders(supabaseKey, accessToken, extra = {}) {
  return {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${accessToken}`,
    ...extra,
  };
}

/**
 * UPSERT en la tabla `games`.
 * Si el app_id ya existe, actualiza name, icon_url y last_updated.
 * Equivalente a onConflict: "app_id" en sync.ts.
 */
async function upsertGames(supabaseUrl, supabaseKey, accessToken, games) {
  const payload = games.map((g) => ({
    app_id: g.appid,
    name: g.name,
    icon_url: g.logo || null,
    last_updated: new Date().toISOString(),
  }));

  const res = await fetch(`${supabaseUrl}/rest/v1/games`, {
    method: "POST",
    headers: restHeaders(supabaseKey, accessToken, {
      // PostgREST: ON CONFLICT DO UPDATE
      Prefer: "resolution=merge-duplicates",
    }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error en upsert de juegos: ${res.status}`);
  }
}

/**
 * Inserta snapshots de tiempo en `playtime_snapshots`.
 * Si hay duplicados de unicidad (mismo user_id + app_id + día), los ignora.
 * Equivalente a ignoreDuplicates en sync.ts.
 */
async function insertSnapshots(supabaseUrl, supabaseKey, accessToken, userId, games) {
  // Solo juegos con tiempo registrado
  const payload = games
    .filter((g) => g.total_minutes > 0)
    .map((g) => ({
      user_id: userId,
      app_id: g.appid,
      total_minutes: g.total_minutes,
      source: "extension",
    }));

  if (payload.length === 0) return { inserted: 0 };

  const res = await fetch(`${supabaseUrl}/rest/v1/playtime_snapshots`, {
    method: "POST",
    headers: restHeaders(supabaseKey, accessToken, {
      // PostgREST: ON CONFLICT DO NOTHING + devuelve el conteo
      Prefer: "resolution=ignore-duplicates,count=exact",
    }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // 23505 = unique_violation → duplicados ignorados, no es un error real
    if (err.code !== "23505") {
      throw new Error(
        err.message || `Error al insertar snapshots: ${res.status}`
      );
    }
  }

  // Content-Range: */N  →  N = filas insertadas
  const contentRange = res.headers.get("Content-Range") || "";
  const match = contentRange.match(/\*\/(\d+)/);
  const inserted = match ? parseInt(match[1], 10) : payload.length;

  return { inserted };
}

// ═══════════════════════════════════════════════════════════
// Message router
// ═══════════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((err) => sendResponse({ success: false, error: err.message }));
  return true; // canal abierto para respuesta asíncrona
});

async function handleMessage(message) {
  const config = await getConfig();
  const session = await getSession();

  switch (message.type) {
    // ── Autenticación ────────────────────────────────────────
    case "LOGIN": {
      const { supabaseUrl, supabaseKey, email, password } = message;
      const data = await supabaseLogin(supabaseUrl, supabaseKey, email, password);
      await saveSession(data);
      await saveConfig({ supabaseUrl, supabaseKey });
      return { success: true, user: data.user };
    }

    case "LOGOUT": {
      if (session?.access_token && config.supabaseUrl && config.supabaseKey) {
        await supabaseLogout(
          config.supabaseUrl,
          config.supabaseKey,
          session.access_token
        );
      }
      await clearSession();
      return { success: true };
    }

    case "GET_AUTH_STATE": {
      return {
        success: true,
        isLoggedIn: !!session?.access_token,
        email: session?.user?.email ?? null,
        hasConfig: !!(config.supabaseUrl && config.supabaseKey),
      };
    }

    // ── Datos del scraping ───────────────────────────────────
    case "GAMES_SCRAPED": {
      if (!session?.access_token) {
        // Notificar al popup si está abierto
        notifyPopup({ type: "SYNC_ERROR", error: "no_auth" });
        return { success: false, error: "Sesión expirada. Vuelve a iniciar sesión." };
      }

      const { games } = message;
      const userId = session.user.id;

      await upsertGames(
        config.supabaseUrl,
        config.supabaseKey,
        session.access_token,
        games
      );

      const { inserted } = await insertSnapshots(
        config.supabaseUrl,
        config.supabaseKey,
        session.access_token,
        userId,
        games
      );

      notifyPopup({
        type: "SYNC_COMPLETE",
        gamesFound: games.length,
        inserted,
      });

      return { success: true, gamesFound: games.length, inserted };
    }

    case "SCRAPE_FAILED": {
      notifyPopup({ type: "SYNC_ERROR", error: message.reason });
      return { success: true };
    }

    default:
      return { success: false, error: `Tipo de mensaje desconocido: ${message.type}` };
  }
}

/**
 * Envía un mensaje al popup (ignora si está cerrado).
 */
function notifyPopup(payload) {
  chrome.runtime.sendMessage(payload).catch(() => {});
}
