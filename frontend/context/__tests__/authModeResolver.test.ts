import { resolveAuthMode } from "../authModeResolver";

describe("resolveAuthMode", () => {
  it("promotes to authenticated whenever a session is present", () => {
    expect(resolveAuthMode("loading", true)).toBe("authenticated");
    expect(resolveAuthMode("guest", true)).toBe("authenticated");
    expect(resolveAuthMode("unauthenticated", true)).toBe("authenticated");
  });

  it("resolves loading to unauthenticated when there is no session", () => {
    expect(resolveAuthMode("loading", false)).toBe("unauthenticated");
  });

  it("preserves guest mode against a spurious null-session event", () => {
    expect(resolveAuthMode("guest", false)).toBe("guest");
  });
});
