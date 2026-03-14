/**
 * content_script.js — se ejecuta en el contexto aislado del content script.
 *
 * Responsabilidades:
 *  1. Escuchar el mensaje START_SCAN del popup.
 *  2. Inyectar injected.js en el contexto de la página para leer rgGames.
 *  3. Recibir los datos vía window.postMessage y reenviarlos al background.
 */

// ── Inyección del script en el mundo de la página ─────────────────────────
function injectPageScript() {
  const existing = document.getElementById("__archaeologist_injected__");
  if (existing) existing.remove(); // re-inyectar limpio en cada escaneo

  const script = document.createElement("script");
  script.id = "__archaeologist_injected__";
  script.src = chrome.runtime.getURL("injected.js");
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

// ── Escuchar mensajes desde injected.js (world MAIN → content script) ─────
window.addEventListener("message", (event) => {
  // Solo procesamos mensajes de la misma ventana con nuestro sello
  if (event.source !== window) return;
  if (event.data?.source !== "ARCHAEOLOGIST") return;

  if (event.data.type === "GAMES_DATA") {
    chrome.runtime.sendMessage({
      type: "GAMES_SCRAPED",
      games: event.data.games,
    });
  }

  if (event.data.type === "NO_DATA") {
    chrome.runtime.sendMessage({
      type: "SCRAPE_FAILED",
      reason: event.data.reason,
    });
  }
});

// ── Escuchar comandos del popup ────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "START_SCAN") {
    injectPageScript();
    sendResponse({ ok: true });
  }
  return false;
});
