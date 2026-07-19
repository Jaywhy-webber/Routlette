jest.mock("../supabase", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

import { supabase } from "../supabase";
import { signUp, signIn, signOut, getSession } from "../auth";

const mockedAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;

afterEach(() => {
  jest.clearAllMocks();
});

describe("signUp", () => {
  it("returns data on success", async () => {
    const data = { user: { id: "u1" } };
    mockedAuth.signUp.mockResolvedValue({ data, error: null } as any);
    await expect(signUp("a@b.com", "pw")).resolves.toEqual(data);
  });

  it("throws when supabase returns an error", async () => {
    const error = new Error("email taken");
    mockedAuth.signUp.mockResolvedValue({ data: null, error } as any);
    await expect(signUp("a@b.com", "pw")).rejects.toBe(error);
  });
});

describe("signIn", () => {
  it("returns data on success", async () => {
    const data = { user: { id: "u1" } };
    mockedAuth.signInWithPassword.mockResolvedValue({ data, error: null } as any);
    await expect(signIn("a@b.com", "pw")).resolves.toEqual(data);
  });

  it("throws when supabase returns an error", async () => {
    const error = new Error("invalid credentials");
    mockedAuth.signInWithPassword.mockResolvedValue({ data: null, error } as any);
    await expect(signIn("a@b.com", "pw")).rejects.toBe(error);
  });
});

describe("signOut", () => {
  it("resolves without throwing on success", async () => {
    mockedAuth.signOut.mockResolvedValue({ error: null } as any);
    await expect(signOut()).resolves.toBeUndefined();
  });

  it("throws when supabase returns an error", async () => {
    const error = new Error("network error");
    mockedAuth.signOut.mockResolvedValue({ error } as any);
    await expect(signOut()).rejects.toBe(error);
  });
});

describe("getSession", () => {
  it("returns the session when present", async () => {
    const session = { user: { id: "u1" }, access_token: "tok" };
    mockedAuth.getSession.mockResolvedValue({ data: { session } } as any);
    await expect(getSession()).resolves.toEqual(session);
  });

  it("returns null when no session is present", async () => {
    mockedAuth.getSession.mockResolvedValue({ data: { session: null } } as any);
    await expect(getSession()).resolves.toBeNull();
  });
});
