export function adminFetch(url: string, options?: RequestInit): Promise<Response> {
  let key = "";
  try {
    const session = JSON.parse(sessionStorage.getItem("admin_session") ?? "{}");
    key = session.key ?? "";
  } catch {}
  return fetch(url, {
    ...options,
    headers: { ...((options?.headers as Record<string, string>) ?? {}), "x-admin-token": key },
  });
}
