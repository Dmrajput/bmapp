import apiService from "@/src/services/apiService";
import SessionManager from "@/src/utils/SessionManager";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext({
  user: null,
  isLoading: true,
  // All auth methods return a consistent, UI-friendly shape and never throw
  signIn: async (_payload) => ({ ok: false, message: "Auth not ready" }),
  signUp: async (_payload) => ({ ok: false, message: "Auth not ready" }),
  signOut: async () => ({ ok: true }),
  logout: async () => ({ ok: true }),
  signInWithGoogle: async (_payload) => ({
    ok: false,
    message: "Auth not ready",
  }),
  isLoggedIn: false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await SessionManager.getSession();
        if (session?.isLoggedIn && session.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.log("❌ Failed to load auth session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const signUp = useCallback(async ({ name, email, password }) => {
    const result = await apiService.register({ name, email, password });

    if (!result?.ok || !result.user) {
      return {
        ok: false,
        message: result?.message || "Unable to create account.",
      };
    }

    setUser(result.user);
    await SessionManager.saveSession(result.user);

    return {
      ok: true,
      message: result.message || "Account created",
    };
  }, []);

  const signIn = useCallback(async ({ email, password, remember }) => {
    const result = await apiService.login({ email, password });

    if (!result?.ok || !result.user) {
      return {
        ok: false,
        message: result?.message || "Invalid email or password.",
      };
    }

    setUser(result.user);

    if (remember) {
      await SessionManager.saveSession(result.user);
    } else {
      await SessionManager.clearSession();
    }

    return {
      ok: true,
      message: result.message || "Login successful",
    };
  }, []);

  const signInWithGoogle = useCallback(async ({ name, email }) => {
    const result = await apiService.googleAuth({ name, email });

    if (!result?.ok || !result.user) {
      return {
        ok: false,
        message: result?.message || "Unable to sign in with Google.",
      };
    }

    setUser(result.user);
    await SessionManager.saveSession(result.user);

    return {
      ok: true,
      message: result.message || "Google auth successful",
    };
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await SessionManager.clearSession();
    return { ok: true };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
      logout: signOut,
      signInWithGoogle,
      isLoggedIn: !!user,
    }),
    [user, isLoading, signIn, signUp, signOut, signInWithGoogle],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
