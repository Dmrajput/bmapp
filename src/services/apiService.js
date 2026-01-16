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
    const normalizeCategory = (raw) => {
      if (!raw) return null;
      const s = String(raw).toLowerCase();
      if (s.includes("funny") || s.includes("comedy") || s.includes("😂"))
        return "funny";
      if (
        s.includes("sad") ||
        s.includes("emotional") ||
        s.includes("😭") ||
        s.includes("😢")
      )
        return "emotional";
      if (s.includes("cinematic") || s.includes("epic")) return "cinematic";
      if (s.includes("viral") || s.includes("trending") || s.includes("🔥"))
        return "trending";
      if (s.includes("lo-fi") || s.includes("lofi")) return "lofi";
      if (s.includes("jazz")) return "jazz";
      if (s.includes("pop")) return "pop";
      return (
        s
          .replace(/[\p{Emoji_Presentation}\p{Emoji}\u200d\uFE0F]/gu, "")
          .trim() || s
      );
    };
    const requestedKey = normalizeCategory(category);
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
        let audioArray = Array.isArray(result.data)
          ? result.data
          : [result.data];

        // Filter by category if provided
        if (category && category !== "All") {
          //   audioArray = audioArray.filter((item) => {
          //     console.log('item.category',item);
          //     const itemKey = normalizeCategory(item.category || '');
          //     if (!requestedKey) return true;
          //     if (!itemKey) return false;
          //     return itemKey.includes(requestedKey) || requestedKey.includes(itemKey);
          //   });
        }

        return audioArray;
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
};

export default apiService;
