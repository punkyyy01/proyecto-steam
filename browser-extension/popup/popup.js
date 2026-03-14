/**
 * popup.js — lógica del popup de la extensión.
 *
 * Estados de UI:
 *   - "loading"  : comprobando sesión al abrir el popup
 *   - "auth"     : usuario no autenticado → formulario de login
 *   - "main"     : usuario autenticado → botón de escaneo + estado
 */

// ── Referencias DOM ──────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const sectionLoading = $("section-loading");
const sectionAuth    = $("section-auth");
const sectionMain    = $("section-main");

const btnLogout  = $("btn-logout");
const btnLogin   = $("btn-login");
const btnScan    = $("btn-scan");

const inputUrl      = $("input-url");
const inputKey      = $("input-key");
const inputEmail    = $("input-email");
const inputPassword = $("input-password");

const authError = $("auth-error");
const scanMsg   = $("scan-msg");
const statusBox = $("status-box");
const userEmailEl = $("user-email");

// ── Helpers de UI ────────────────────────────────────────────────────────

function showSection(name) {
  sectionLoading.hidden = name !== "loading";
  sectionAuth.hidden    = name !== "auth";
  sectionMain.hidden    = name !== "main";
  btnLogout.hidden      = name !== "main";
}

/** Actualiza el status-box con el ícono y mensaje apropiados. */
function setStatus(type, text) {
  const icons = {
    idle: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
           </svg>`,
    loading: `<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>`,
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4caf75" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>`,
    error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cf6679" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>`,
  };

  statusBox.className = `status-box ${
    type === "idle" ? "" :
    type === "loading" ? "is-loading" :
    type === "success" ? "is-success" : "is-error"
  }`;

  statusBox.innerHTML = `<div class="status-row">${icons[type] ?? icons.idle}<span>${text}</span></div>`;
}

function showMsg(el, text, isError = false) {
  el.textContent = text;
  el.className   = `msg ${isError ? "msg-error" : "msg-success"}`;
  el.hidden      = false;
}
function hideMsg(el) { el.hidden = true; }

// ── Inicialización ───────────────────────────────────────────────────────

async function init() {
  showSection("loading");

  const state = await chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" });

  if (state.isLoggedIn) {
    userEmailEl.textContent = state.email ?? "";
    showSection("main");
    setStatus("idle", "Listo para escanear");
  } else {
    // Pre-rellenar URL y key si ya fueron guardadas antes
    if (state.hasConfig) {
      const stored = await chrome.storage.local.get("extension_config");
      const cfg = stored.extension_config ?? {};
      if (cfg.supabaseUrl) inputUrl.value = cfg.supabaseUrl;
      if (cfg.supabaseKey) inputKey.value = cfg.supabaseKey;
    }
    showSection("auth");
  }
}

// ── Login ────────────────────────────────────────────────────────────────

btnLogin.addEventListener("click", async () => {
  hideMsg(authError);

  const supabaseUrl = inputUrl.value.trim().replace(/\/$/, "");
  const supabaseKey = inputKey.value.trim();
  const email       = inputEmail.value.trim();
  const password    = inputPassword.value;

  if (!supabaseUrl || !supabaseKey || !email || !password) {
    showMsg(authError, "Completa todos los campos.", true);
    return;
  }

  btnLogin.disabled    = true;
  btnLogin.textContent = "Conectando…";

  const res = await chrome.runtime.sendMessage({
    type: "LOGIN",
    supabaseUrl,
    supabaseKey,
    email,
    password,
  });

  if (res.success) {
    userEmailEl.textContent = res.user?.email ?? email;
    showSection("main");
    setStatus("idle", "Listo para escanear");
    inputPassword.value = ""; // limpiar por seguridad
  } else {
    showMsg(authError, res.error ?? "Error al iniciar sesión.", true);
    btnLogin.disabled    = false;
    btnLogin.textContent = "Iniciar sesión";
  }
});

// Enviar con Enter en el campo de contraseña
inputPassword.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnLogin.click();
});

// ── Logout ───────────────────────────────────────────────────────────────

btnLogout.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "LOGOUT" });
  showSection("auth");
  btnLogin.disabled    = false;
  btnLogin.textContent = "Iniciar sesión";
});

// ── Scan ─────────────────────────────────────────────────────────────────

btnScan.addEventListener("click", async () => {
  hideMsg(scanMsg);

  // 1. Obtener pestaña activa
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    showMsg(scanMsg, "No se puede acceder a la pestaña actual.", true);
    return;
  }

  // 2. Validar que estamos en Steam antes de intentar nada
  if (!tab.url?.includes("steamcommunity.com")) {
    setStatus("error", "Navega a la página de juegos de Steam primero.");
    showMsg(scanMsg, "steamcommunity.com/id/TU_ID/games", true);
    return;
  }

  btnScan.disabled = true;
  setStatus("loading", "Escaneando historial de Steam…");

  // 3. Enviar START_SCAN al content_script con callback para detectar errores
  chrome.tabs.sendMessage(tab.id, { type: "START_SCAN" }, (response) => {
    if (chrome.runtime.lastError) {
      // El content_script no está inyectado → página incorrecta o no recargada
      console.error("[Archaeologist]", chrome.runtime.lastError.message);
      setStatus("error", "Recarga la página de Steam e inténtalo de nuevo.");
      showMsg(scanMsg, "El content script no está activo. Recarga la pestaña de Steam.", true);
      btnScan.disabled = false;
      return;
    }
    // response = { ok: true } del content_script — la inyección fue exitosa,
    // el resultado llegará vía SYNC_COMPLETE / SYNC_ERROR desde el background.
    console.log("[Archaeologist] Inyección exitosa:", response);
  });
});

// ── Mensajes del background ──────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SYNC_COMPLETE") {
    setStatus(
      "success",
      `¡Listo! ${message.gamesFound} juegos · ${message.inserted} snapshots guardados`
    );
    btnScan.disabled = false;
    hideMsg(scanMsg);
  }

  if (message.type === "SYNC_ERROR") {
    const isNoAuth = message.error === "no_auth";
    setStatus("error", isNoAuth ? "Sesión expirada. Vuelve a iniciar sesión." : "No se encontraron datos de juego.");
    showMsg(
      scanMsg,
      isNoAuth
        ? "Cierra sesión y vuelve a conectar."
        : "Asegúrate de estar en steamcommunity.com/id/TU_ID/games y recarga la página.",
      true
    );
    btnScan.disabled = false;
  }
});

// ── Arrancar ─────────────────────────────────────────────────────────────
init();
