// ─── Storage keys ────────────────────────────────────────────────────────────

export const REFS_KEY    = "dc_refs";        // Record<`${cid}_${uid}`, count>
const PENDING_KEY        = "dc_pending_ref"; // { refCode, concursoId }
const VISITED_KEY        = "dc_ref_visited"; // string[]  `${cid}_${uid}`
const EMAIL_KEY          = "dc_ref_emails";  // Record<`${cid}_${uid}`, string[]>
const USERS_KEY          = "dc_users";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PendingRef { refCode: string; concursoId: number }
interface StoredUser         { id: string; nombre: string }

// ─── Pending referral ────────────────────────────────────────────────────────

export function savePendingRef(refCode: string, concursoId: number): void {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify({ refCode, concursoId })); }
  catch { /* noop */ }
}

export function getPendingRef(): PendingRef | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingRef) : null;
  } catch { return null; }
}

export function clearPendingRef(): void {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* noop */ }
}

// ─── Ref counts ──────────────────────────────────────────────────────────────

export function getRefCount(concursoId: number, userId: string): number {
  try {
    const store = JSON.parse(localStorage.getItem(REFS_KEY) ?? "{}") as Record<string, number>;
    return store[`${concursoId}_${userId}`] ?? 0;
  } catch { return 0; }
}

export function incrementRef(concursoId: number, userId: string): void {
  try {
    const store = JSON.parse(localStorage.getItem(REFS_KEY) ?? "{}") as Record<string, number>;
    const key = `${concursoId}_${userId}`;
    store[key] = (store[key] ?? 0) + 1;
    localStorage.setItem(REFS_KEY, JSON.stringify(store));
  } catch { /* noop */ }
}

export function getAllRefCounts(userId: string): Array<{ concursoId: number; count: number }> {
  try {
    const store = JSON.parse(localStorage.getItem(REFS_KEY) ?? "{}") as Record<string, number>;
    const result: Array<{ concursoId: number; count: number }> = [];
    for (const [key, count] of Object.entries(store)) {
      const idx = key.indexOf("_");
      if (idx === -1) continue;
      if (key.slice(idx + 1) === userId && count > 0) {
        result.push({ concursoId: Number(key.slice(0, idx)), count });
      }
    }
    return result.sort((a, b) => b.count - a.count);
  } catch { return []; }
}

// ─── Visit tracking (device-level, for authenticated same-tab dedup) ─────────

export function hasVisited(concursoId: number, refUserId: string): boolean {
  try {
    const list = JSON.parse(localStorage.getItem(VISITED_KEY) ?? "[]") as string[];
    return list.includes(`${concursoId}_${refUserId}`);
  } catch { return false; }
}

export function markVisited(concursoId: number, refUserId: string): void {
  try {
    const list = JSON.parse(localStorage.getItem(VISITED_KEY) ?? "[]") as string[];
    const entry = `${concursoId}_${refUserId}`;
    if (!list.includes(entry)) {
      list.push(entry);
      localStorage.setItem(VISITED_KEY, JSON.stringify(list));
    }
  } catch { /* noop */ }
}

// ─── Email deduplication ─────────────────────────────────────────────────────

export function hasEmailCounted(concursoId: number, refUserId: string, email: string): boolean {
  try {
    const store = JSON.parse(localStorage.getItem(EMAIL_KEY) ?? "{}") as Record<string, string[]>;
    return (store[`${concursoId}_${refUserId}`] ?? []).includes(email.toLowerCase());
  } catch { return false; }
}

export function markEmailCounted(concursoId: number, refUserId: string, email: string): void {
  try {
    const store = JSON.parse(localStorage.getItem(EMAIL_KEY) ?? "{}") as Record<string, string[]>;
    const key = `${concursoId}_${refUserId}`;
    if (!store[key]) store[key] = [];
    if (!store[key].includes(email.toLowerCase())) {
      store[key].push(email.toLowerCase());
      localStorage.setItem(EMAIL_KEY, JSON.stringify(store));
    }
  } catch { /* noop */ }
}

// ─── User lookup ──────────────────────────────────────────────────────────────

/** Returns the referrer's first name, or null if not found in this device's storage. */
export function getRefUserName(userId: string): string | null {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]") as StoredUser[];
    const found = users.find(u => u.id === userId);
    return found ? found.nombre.split(" ")[0] : null;
  } catch { return null; }
}
