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
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of favorite items
   */
  fetchFavorites: async (userId) => {
    try {
      if (!userId) {
        console.warn("⚠️ fetchFavorites called without userId");
        return [];
      }

      const response = await fetch(
        `${API_BASE_URL}/favorites?userId=${encodeURIComponent(userId)}`,
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

      return [];
    } catch (error) {
      console.error("❌ Error fetching favorites:", error);
      return [];
    }
  },

  /**
   * Add favorite in backend
   * @param {Object} item - Audio item
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Favorite object
   */
  addFavorite: async (item, userId) => {
    try {
      if (!userId) {
        console.warn("⚠️ addFavorite called without userId");
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
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
   * @param {string} userId - User ID
   */
  removeFavorite: async (audioId, userId) => {
    try {
      if (!userId) {
        console.warn("⚠️ removeFavorite called without userId");
        return false;
      }

      const response = await fetch(
        `${API_BASE_URL}/favorites/${audioId}?userId=${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

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
      if (!API_BASE_URL) {
        return {
          ok: false,
          message: "API URL not configured. Please check your environment variables.",
        };
      }

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("❌ Non-JSON response:", text.substring(0, 200));
        
        // Check for specific error cases
        if (text.includes("Service Suspended") || text.includes("service suspended")) {
          return {
            ok: false,
            message: "Backend service is suspended. If using Render.com free tier, the service sleeps after inactivity. Please wake it up or use a local backend.",
          };
        }
        
        if (text.includes("404") || response.status === 404) {
          return {
            ok: false,
            message: "API endpoint not found. Please check if the backend server is running and the URL is correct.",
          };
        }
        
        return {
          ok: false,
          message: `Server error (${response.status}). Please check if the API server is running.`,
        };
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        const message =
          result?.error || result?.message || "Unable to create account";
        return { ok: false, message };
      }

      return {
        ok: true,
        user: result.data?.user || null,
        message: result.message || "Account created",
      };
    } catch (error) {
      console.error("❌ Error registering:", error);
      
      // Handle JSON parse errors specifically
      if (error.message && error.message.includes("JSON")) {
        return {
          ok: false,
          message: "Server returned invalid response. Please check if the API server is running and accessible.",
        };
      }
      
      return {
        ok: false,
        message: "Unable to reach server. Please check your connection and API URL.",
      };
    }
  },

  /**
   * Login user
   */
  login: async ({ email, password }) => {
    try {
      if (!API_BASE_URL) {
        return {
          ok: false,
          message: "API URL not configured. Please check your environment variables.",
        };
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("❌ Non-JSON response:", text.substring(0, 200));
        
        // Check for specific error cases
        if (text.includes("Service Suspended") || text.includes("service suspended")) {
          return {
            ok: false,
            message: "Backend service is suspended. If using Render.com free tier, the service sleeps after inactivity. Please wake it up or use a local backend.",
          };
        }
        
        if (text.includes("404") || response.status === 404) {
          return {
            ok: false,
            message: "API endpoint not found. Please check if the backend server is running and the URL is correct.",
          };
        }
        
        return {
          ok: false,
          message: `Server error (${response.status}). Please check if the API server is running.`,
        };
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        const message =
          result?.error || result?.message || "Invalid email or password.";
        return { ok: false, message };
      }

      return {
        ok: true,
        user: result.data?.user || null,
        message: result.message || "Login successful",
      };
    } catch (error) {
      console.error("❌ Error logging in:", error);
      
      // Handle JSON parse errors specifically
      if (error.message && error.message.includes("JSON")) {
        return {
          ok: false,
          message: "Server returned invalid response. Please check if the API server is running and accessible.",
        };
      }
      
      return {
        ok: false,
        message: "Unable to reach server. Please check your connection and API URL.",
      };
    }
  },

  /**
   * Google auth (stubbed)
   */
  googleAuth: async ({ name, email }) => {
    try {
      if (!API_BASE_URL) {
        return {
          ok: false,
          message: "API URL not configured. Please check your environment variables.",
        };
      }

      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("❌ Non-JSON response:", text.substring(0, 200));
        
        // Check for specific error cases
        if (text.includes("Service Suspended") || text.includes("service suspended")) {
          return {
            ok: false,
            message: "Backend service is suspended. If using Render.com free tier, the service sleeps after inactivity. Please wake it up or use a local backend.",
          };
        }
        
        if (text.includes("404") || response.status === 404) {
          return {
            ok: false,
            message: "API endpoint not found. Please check if the backend server is running and the URL is correct.",
          };
        }
        
        return {
          ok: false,
          message: `Server error (${response.status}). Please check if the API server is running.`,
        };
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        const message =
          result?.error || result?.message || "Unable to sign in with Google.";
        return { ok: false, message };
      }

      return {
        ok: true,
        user: result.data?.user || null,
        message: result.message || "Google auth successful",
      };
    } catch (error) {
      console.error("❌ Error with Google auth:", error);
      
      // Handle JSON parse errors specifically
      if (error.message && error.message.includes("JSON")) {
        return {
          ok: false,
          message: "Server returned invalid response. Please check if the API server is running and accessible.",
        };
      }
      
      return {
        ok: false,
        message: "Unable to reach server. Please check your connection and API URL.",
      };
    }
  },
};

export default apiService;
