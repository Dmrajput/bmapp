import apiService from "@/src/services/apiService";
import { useAuth } from "@/context/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

const FAVORITES_KEY = "bmapp:favorites";

const FavoritesContext = createContext({
  favorites: [],
  isFavorite: () => false,
  addFavorite: () => {},
  removeFavorite: () => {},
  toggleFavorite: () => {},
});

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [isReady, setIsReady] = useState(false);

  const normalizeFavorite = useCallback((item) => {
    if (!item) return null;
    return {
      id: item.audioId || item.id,
      title: item.title || "Untitled",
      category: item.category || "General",
      durationSeconds: item.duration || item.durationSeconds || 0,
      uri: item.audioUrl || item.uri,
      ...item,
    };
  }, []);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        // Only load favorites if user is logged in
        if (!user?.id) {
          setFavorites([]);
          setIsReady(true);
          return;
        }

        const raw = await AsyncStorage.getItem(FAVORITES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setFavorites(parsed);
          }
        }

        // Fetch user-specific favorites from backend
        const remote = await apiService.fetchFavorites(user.id);
        if (Array.isArray(remote) && remote.length > 0) {
          const normalized = remote
            .map((item) => normalizeFavorite(item))
            .filter(Boolean);
          setFavorites(normalized);
        }
      } catch (error) {
        console.log("❌ Failed to load favorites:", error);
      } finally {
        setIsReady(true);
      }
    };

    loadFavorites();
  }, [user?.id, normalizeFavorite]);

  useEffect(() => {
    if (!isReady) return;
    const persist = async () => {
      try {
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.log("❌ Failed to save favorites:", error);
      }
    };

    persist();
  }, [favorites, isReady]);

  // Clear favorites when user logs out
  useEffect(() => {
    if (!user?.id) {
      setFavorites([]);
    }
  }, [user?.id]);

  const isFavorite = useCallback(
    (id) => favorites.some((item) => item.id === id),
    [favorites],
  );

  const addFavorite = useCallback(
    async (item) => {
      if (!item?.id) return;
      if (!user?.id) {
        console.warn("⚠️ Cannot add favorite: user not logged in");
        return;
      }

      setFavorites((prev) => {
        if (prev.some((existing) => existing.id === item.id)) return prev;
        return [item, ...prev];
      });
      await apiService.addFavorite(item, user.id);
    },
    [user?.id],
  );

  const removeFavorite = useCallback(
    async (id) => {
      if (!user?.id) {
        console.warn("⚠️ Cannot remove favorite: user not logged in");
        return;
      }

      setFavorites((prev) => prev.filter((item) => item.id !== id));
      await apiService.removeFavorite(id, user.id);
    },
    [user?.id],
  );

  const toggleFavorite = useCallback(
    (item) => {
      if (!item?.id) return;
      if (!user?.id) {
        console.warn("⚠️ Cannot toggle favorite: user not logged in");
        return;
      }
      if (isFavorite(item.id)) {
        removeFavorite(item.id);
      } else {
        addFavorite(item);
      }
    },
    [addFavorite, isFavorite, removeFavorite, user?.id],
  );

  const value = useMemo(
    () => ({
      favorites,
      isFavorite,
      addFavorite,
      removeFavorite,
      toggleFavorite,
    }),
    [favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
