// Lightweight client-side stats buffer
// Batches events and sends them every 60s or on page unload (1 request max)

let buffer: { tipo: string; valor: string }[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listenerAdded = false;

function flush() {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, 50);
  // Use sendBeacon for reliability on page unload, fetch as fallback
  const body = JSON.stringify({ eventos: batch });
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/stats", body);
  } else {
    fetch("/api/stats", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  }
}

function scheduleFlush() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, 60000);
}

function ensureUnloadListener() {
  if (listenerAdded || typeof window === "undefined") return;
  listenerAdded = true;
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

export function trackStat(tipo: string, valor: string) {
  if (!valor || valor.trim().length === 0) return;
  buffer.push({ tipo, valor: valor.trim() });
  ensureUnloadListener();
  scheduleFlush();
}
