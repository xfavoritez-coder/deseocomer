// Lightweight client-side stats buffer
// Flushes after 2s of inactivity (debounce) — reliable without depending on unload events

let buffer: { tipo: string; valor: string }[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, 50);
  const body = JSON.stringify({ eventos: batch });
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/stats", blob);
  } else {
    fetch("/api/stats", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  }
}

function scheduleFlush() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, 2000);
}

export function trackStat(tipo: string, valor: string) {
  if (!valor || valor.trim().length === 0) return;
  buffer.push({ tipo, valor: valor.trim() });
  scheduleFlush();
}
