// API Service for communicating with backend
import { API_BASE_URL, API_DEBUG } from "../config/api.config";

if (API_DEBUG) {
  console.log("API Base URL:", API_BASE_URL);
}

const apiService = {
  /**
   * Fetch all audio/music from backend
   * @returns {Promise<Array>} Array of audio objects
   */
  fetchAllAudio: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/audio`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        const audioArray = Array.isArray(result.data)
          ? result.data
          : [result.data];
        return audioArray;
      }

      console.warn("⚠️ No audio data in response");
      return [];
    } catch (error) {
      console.error("❌ Error fetching audio:", error);
      return [];
    }
  },

  /**
   * Fetch audio by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of audio objects in category
   */
  fetchAudioByCategory: async (category) => {
    try {
      if (!category || category === "All") {
        return await apiService.fetchAllAudio();
      }

      const normalizedCategory = String(category)
        .replace(/[\p{Emoji_Presentation}\p{Emoji}\u200d\uFE0F]/gu, "")
        .replace(/[_/\\-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const encodedCategory = encodeURIComponent(
        normalizedCategory || String(category).trim(),
      );

      const response = await fetch(
        `${API_BASE_URL}/audio/category/${encodedCategory}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : [result.data];
      }

      console.warn("⚠️ No audio data in response");
      return [];
    } catch (error) {
      console.error("❌ Error fetching audio by category:", error);
      return [];
    }
  },

  /**
   * Fetch single audio by ID
   * @param {string} id - Audio ID
   * @returns {Promise<Object>} Audio object
   */
  fetchAudioById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/audio/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error(`Error fetching audio ${id}:`, error);
      return null;
    }
  },

  /**
   * Transform backend audio format to frontend format
   * @param {Object} backendAudio - Audio object from backend
   * @returns {Object} Transformed audio object
   */
  transformAudioData: (backendAudio) => {
    if (!backendAudio) return null;

    const duration = backendAudio.duration || 0;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const durationStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    const transformed = {
      id: backendAudio._id || backendAudio.id,
      title: backendAudio.title || "Untitled",
      artist: backendAudio.artist || "Unknown Artist",
      category: backendAudio.category || "General",
      duration: durationStr,
      durationSeconds: duration,
      uri: backendAudio.audioUrl || backendAudio.uri,
      createdAt: backendAudio.createdAt,
      ...backendAudio, // Include all original fields
    };

    return transformed;
  },

  /**
   * Fetch and transform all audio data
   * @returns {Promise<Array>} Array of transformed audio objects
   */
  fetchFormattedAudio: async () => {
    const audioList = await apiService.fetchAllAudio();
    const formatted = audioList.map((audio) =>
      apiService.transformAudioData(audio),
    );
    return formatted;
  },

  /**
   * Fetch and transform audio by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of transformed audio objects
   */
  fetchFormattedAudioByCategory: async (category) => {
    const audioList = await apiService.fetchAudioByCategory(category);
    return audioList.map((audio) => apiService.transformAudioData(audio));
  },

  /**
   * Fetch favorites from backend
   * @returns {Promise<Array>} Array of favorite items
   */
  fetchFavorites: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : [result.data];
      }

      return [];
    } catch (error) {
      console.error("❌ Error fetching favorites:", error);
      return [];
    }
  },

  /**
   * Add favorite in backend
   * @param {Object} item - Audio item
   * @returns {Promise<Object|null>} Favorite object
   */
  addFavorite: async (item) => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioId: item.id,
          title: item.title,
          category: item.category,
          duration: item.durationSeconds || item.duration,
          audioUrl: item.uri,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error("❌ Error adding favorite:", error);
      return null;
    }
  },

  /**
   * Remove favorite in backend
   * @param {string} audioId - Audio ID
   */
  removeFavorite: async (audioId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/${audioId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("❌ Error removing favorite:", error);
      return false;
    }
  },

  /**
   * Register user
   */
  register: async ({ name, email, password }) => {
    try {
      console.log("Registering user:", email);
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      return result.data;
    } catch (error) {
      console.error("❌ Error registering:", error);
      throw error;
    }
  },

  /**
   * Login user
   */
  login: async ({ email, password }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Login failed");
      }

      return result.data;
    } catch (error) {
      console.error("❌ Error logging in:", error);
      throw error;
    }
  },

  /**
   * Google auth (stubbed)
   */
  googleAuth: async ({ name, email }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Google auth failed");
      }

      return result.data;
    } catch (error) {
      console.error("❌ Error with Google auth:", error);
      throw error;
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async ({ refreshToken }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Refresh failed");
      }

      return result.data;
    } catch (error) {
      console.error("❌ Error refreshing token:", error);
      throw error;
    }
  },
};

export default apiService;
