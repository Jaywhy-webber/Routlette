import * as React from "react";
import TestRenderer, { act } from "react-test-renderer";

jest.mock("../../services/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

import { supabase } from "../../services/supabase";
import { AuthModeProvider, useAuthMode } from "../AuthModeContext";
import type { AuthMode } from "../authModeResolver";

const mockedGetSession = supabase.auth.getSession as jest.Mock;
const mockedOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;

function Probe({ onValue }: { onValue: (v: AuthMode) => void }) {
  const { authMode } = useAuthMode();
  React.useEffect(() => {
    onValue(authMode);
  });
  return null;
}

function subscriptionMock(unsubscribe = jest.fn()) {
  return { data: { subscription: { unsubscribe } } };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("useAuthMode", () => {
  it("throws when used outside a provider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      act(() => {
        TestRenderer.create(<Probe onValue={jest.fn()} />);
      });
    }).toThrow("useAuthMode must be used within an AuthModeProvider");
    consoleSpy.mockRestore();
  });
});

describe("AuthModeProvider", () => {
  it("starts in loading state before getSession resolves", async () => {
    mockedGetSession.mockReturnValue(new Promise(() => {})); // never resolves
    mockedOnAuthStateChange.mockReturnValue(subscriptionMock());

    const values: AuthMode[] = [];
    act(() => {
      TestRenderer.create(
        <AuthModeProvider>
          <Probe onValue={(v) => values.push(v)} />
        </AuthModeProvider>
      );
    });

    expect(values).toEqual(["loading"]);
  });

  it("resolves to authenticated when getSession returns a session", async () => {
    mockedGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } } });
    mockedOnAuthStateChange.mockReturnValue(subscriptionMock());

    const values: AuthMode[] = [];
    await act(async () => {
      TestRenderer.create(
        <AuthModeProvider>
          <Probe onValue={(v) => values.push(v)} />
        </AuthModeProvider>
      );
    });

    expect(values[values.length - 1]).toBe("authenticated");
  });

  it("resolves to unauthenticated when getSession returns no session", async () => {
    mockedGetSession.mockResolvedValue({ data: { session: null } });
    mockedOnAuthStateChange.mockReturnValue(subscriptionMock());

    const values: AuthMode[] = [];
    await act(async () => {
      TestRenderer.create(
        <AuthModeProvider>
          <Probe onValue={(v) => values.push(v)} />
        </AuthModeProvider>
      );
    });

    expect(values[values.length - 1]).toBe("unauthenticated");
  });

  it("updates authMode live when onAuthStateChange fires", async () => {
    mockedGetSession.mockResolvedValue({ data: { session: null } });
    let capturedCallback: (event: string, session: any) => void = () => {};
    mockedOnAuthStateChange.mockImplementation((cb: any) => {
      capturedCallback = cb;
      return subscriptionMock();
    });

    const values: AuthMode[] = [];
    await act(async () => {
      TestRenderer.create(
        <AuthModeProvider>
          <Probe onValue={(v) => values.push(v)} />
        </AuthModeProvider>
      );
    });

    expect(values[values.length - 1]).toBe("unauthenticated");

    act(() => {
      capturedCallback("SIGNED_IN", { user: { id: "u1" } });
    });

    expect(values[values.length - 1]).toBe("authenticated");
  });

  it("calls unsubscribe on unmount", async () => {
    mockedGetSession.mockResolvedValue({ data: { session: null } });
    const unsubscribe = jest.fn();
    mockedOnAuthStateChange.mockReturnValue(subscriptionMock(unsubscribe));

    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <AuthModeProvider>
          <Probe onValue={() => {}} />
        </AuthModeProvider>
      );
    });

    act(() => {
      renderer.unmount();
    });

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
