import * as React from "react";
import { supabase } from "../services/supabase";
import { AuthMode, resolveAuthMode } from "./authModeResolver";

export type { AuthMode };

type AuthModeContextValue = {
  authMode: AuthMode;
  setAuthMode: React.Dispatch<React.SetStateAction<AuthMode>>;
};

const AuthModeContext = React.createContext<AuthModeContextValue | undefined>(undefined);

export function AuthModeProvider({ children }: React.PropsWithChildren) {
  const [authMode, setAuthMode] = React.useState<AuthMode>("loading");

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthMode((prev) => resolveAuthMode(prev, !!session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthMode((prev) => resolveAuthMode(prev, !!session));
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = React.useMemo(() => ({ authMode, setAuthMode }), [authMode]);

  return <AuthModeContext.Provider value={value}>{children}</AuthModeContext.Provider>;
}

export function useAuthMode(): AuthModeContextValue {
  const ctx = React.useContext(AuthModeContext);
  if (!ctx) {
    throw new Error("useAuthMode must be used within an AuthModeProvider");
  }
  return ctx;
}
