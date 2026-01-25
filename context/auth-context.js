import apiService from "@/src/services/apiService";
import * as SecureStore from "expo-secure-store";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

const AUTH_KEY = "bmapp_auth";

const AuthContext = createContext({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  logout: async () => {},
  signInWithGoogle: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback(async (payload) => {
    await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify(payload));
  }, []);

  const clearSession = useCallback(async () => {
    await SecureStore.deleteItemAsync(AUTH_KEY);
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const raw = await SecureStore.getItemAsync(AUTH_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setUser(parsed.user || null);
          setAccessToken(parsed.accessToken || null);
          setRefreshToken(parsed.refreshToken || null);
        }
      } catch (error) {
        console.log("❌ Failed to load auth session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const signUp = useCallback(
    async ({ name, email, password }) => {
      const data = await apiService.register({ name, email, password });
      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      await persistSession({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
    [persistSession],
  );

  const signIn = useCallback(
    async ({ email, password, remember }) => {
      const data = await apiService.login({ email, password });
      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      if (remember) {
        await persistSession({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
      } else {
        await clearSession();
      }
    },
    [persistSession, clearSession],
  );

  const signInWithGoogle = useCallback(
    async ({ name, email }) => {
      const data = await apiService.googleAuth({ name, email });
      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      await persistSession({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
    [persistSession],
  );

  const refreshSession = useCallback(async () => {
    if (!refreshToken) return null;
    const data = await apiService.refreshToken({ refreshToken });
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      await persistSession({
        user,
        accessToken: data.accessToken,
        refreshToken,
      });
    }
    return data?.accessToken || null;
  }, [persistSession, refreshToken, user]);

  const signOut = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    await clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      isLoading,
      signIn,
      signUp,
      signOut,
      logout: signOut,
      signInWithGoogle,
      refreshSession,
    }),
    [
      user,
      accessToken,
      refreshToken,
      isLoading,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
