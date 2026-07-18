export type AuthMode = "loading" | "authenticated" | "guest" | "unauthenticated";

/**
 * Given the previous authMode and a Supabase session-presence signal, decides
 * the next authMode. A truthy session always wins (promotes to
 * "authenticated"). A falsy session preserves "guest" if that's what we were
 * already in (guests never hold a session, so a spurious null-session event
 * shouldn't downgrade an active guest), otherwise falls back to
 * "unauthenticated".
 */
export function resolveAuthMode(prev: AuthMode, hasSession: boolean): AuthMode {
  if (hasSession) return "authenticated";
  return prev === "guest" ? "guest" : "unauthenticated";
}
