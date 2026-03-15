/**
 * popup.js — lógica del popup de la extensión.
 *
 * Estados de UI:
 *   - "loading"  : comprobando sesión al abrir el popup
 *   - "auth"     : usuario no autenticado → formulario de login
 *   - "main"     : usuario autenticado → botón de escaneo + estado
 */

// ── Configuración Supabase (hardcoded — no exponer en UI) ─────────────────
const SUPABASE_URL = "https://hncdsijnemjueviokxmw.supabase.co";
const SUPABASE_KEY = "sb_publishable_bINfylePrhPffBnG-d-OgA_xYWTrtSN";

// ── Referencias DOM ──────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const sectionLoading = $("section-loading");
const sectionAuth    = $("section-auth");
const sectionMain    = $("section-main");

const btnLogin    = $("btn-login");
const btnLogout   = $("btn-logout");
const btnScan     = $("btn-scan");

const inputEmail    = $("input-email");
const inputPassword = $("input-password");

const userEmailEl       = $("user-email");
const statusBox         = $("status-box");
const authNotification  = $("auth-notification");
const scanNotification  = $("scan-notification");

const btnLoginText      = $("btn-login-text");
const btnLoginSpinner   = $("btn-login-spinner");
const btnScanIcon       = $("btn-scan-icon");
const btnScanSpinner    = $("btn-scan-spinner");
const btnScanText       = $("btn-scan-text");

// ── Helpers de UI ────────────────────────────────────────────────────────

function showSection(name) {
  sectionLoading.hidden = name !== "loading";
  sectionAuth.hidden    = name !== "auth";
  sectionMain.hidden    = name !== "main";
}

/** Muestra una notificación estilizada dentro del popup. */
function showNotification(el, text, type = "error") {
  const icons = {
    error: `<svg class="notification-icon" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>`,
    success: `<svg class="notification-icon" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>`,
    info: `<svg class="notification-icon" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="12" r="10"/>
             <line x1="12" y1="16" x2="12" y2="12"/>
             <line x1="12" y1="8" x2="12.01" y2="8"/>
           </svg>`,
  };

  el.className = `notification is-${type}`;
  el.innerHTML = `${icons[type] ?? icons.info}<span>${text}</span>`;
  el.hidden = false;
}

function hideNotification(el) { el.hidden = true; }

/** Actualiza el status-box con icono y mensaje. */
function setStatus(type, text) {
  const icons = {
    idle: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2">
             <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
           </svg>`,
    loading: `<svg class="spin" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>`,
    success: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="#22c55e" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>`,
    error: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="#ef4444" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>`,
  };

  statusBox.className = `status-box${
    type === "loading" ? " is-loading" :
    type === "success" ? " is-success" :
    type === "error"   ? " is-error"   : ""
  }`;

  statusBox.innerHTML = `<div class="status-row">${icons[type] ?? icons.idle}<span>${text}</span></div>`;
}

function setScanBusy(busy) {
  btnScan.disabled     = busy;
  btnScanIcon.hidden   = busy;
  btnScanSpinner.hidden = !busy;
  btnScanText.textContent = busy ? "Escaneando…" : "Escanear historial actual";
}

function setLoginBusy(busy) {
  btnLogin.disabled      = busy;
  btnLoginSpinner.hidden = !busy;
  btnLoginText.textContent = busy ? "Conectando…" : "Iniciar sesión";
}

// ── Inicialización ───────────────────────────────────────────────────────

async function init() {
  showSection("loading");

  try {
    const state = await chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" });

    if (state?.isLoggedIn) {
      userEmailEl.textContent = state.email ?? "";
      showSection("main");
      setStatus("idle", "Listo para escanear");
    } else {
      showSection("auth");
    }
  } catch (_) {
    // El service worker aún no estaba activo — mostrar login como estado seguro
    showSection("auth");
  }
}

// ── Login ────────────────────────────────────────────────────────────────

btnLogin.addEventListener("click", async () => {
  hideNotification(authNotification);

  const email    = inputEmail.value.trim();
  const password = inputPassword.value;

  if (!email || !password) {
    showNotification(authNotification, "Introduce tu email y contraseña.", "error");
    return;
  }

  setLoginBusy(true);

  const res = await chrome.runtime.sendMessage({
    type: "LOGIN",
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_KEY,
    email,
    password,
  });

  if (res.success) {
    userEmailEl.textContent = res.user?.email ?? email;
    inputPassword.value = "";
    showSection("main");
    setStatus("idle", "Listo para escanear");
  } else {
    showNotification(
      authNotification,
      res.error ?? "Credenciales incorrectas. Inténtalo de nuevo.",
      "error"
    );
    setLoginBusy(false);
  }
});

// Enviar con Enter en el campo de contraseña
inputPassword.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnLogin.click();
});

// ── Logout ───────────────────────────────────────────────────────────────

btnLogout.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "LOGOUT" });
  setLoginBusy(false);
  hideNotification(authNotification);
  showSection("auth");
});

// ── Scan ─────────────────────────────────────────────────────────────────

btnScan.addEventListener("click", async () => {
  hideNotification(scanNotification);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    showNotification(scanNotification, "No se puede acceder a la pestaña actual.", "error");
    return;
  }

  if (!tab.url?.includes("steamcommunity.com")) {
    setStatus("error", "Navega a la página de juegos de Steam primero.");
    showNotification(
      scanNotification,
      "Abre steamcommunity.com/id/TU_ID/games y vuelve a pulsar Escanear.",
      "info"
    );
    return;
  }

  setScanBusy(true);
  setStatus("loading", "Escaneando historial de Steam…");

  chrome.tabs.sendMessage(tab.id, { type: "START_SCAN" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("[Archaeologist]", chrome.runtime.lastError.message);
      setStatus("error", "Recarga la página de Steam e inténtalo de nuevo.");
      showNotification(
        scanNotification,
        "El content script no está activo. Recarga la pestaña de Steam.",
        "error"
      );
      setScanBusy(false);
      return;
    }
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
    setScanBusy(false);
    hideNotification(scanNotification);
  }

  if (message.type === "SYNC_ERROR") {
    const isNoAuth = message.error === "no_auth";
    setStatus(
      "error",
      isNoAuth ? "Sesión expirada. Vuelve a iniciar sesión." : "No se encontraron datos de juego."
    );
    showNotification(
      scanNotification,
      isNoAuth
        ? "Tu sesión ha expirado. Cierra sesión y vuelve a conectar."
        : "Asegúrate de estar en steamcommunity.com/id/TU_ID/games y recarga la página.",
      "error"
    );
    setScanBusy(false);
  }
});

// ── Arrancar ─────────────────────────────────────────────────────────────
init();
