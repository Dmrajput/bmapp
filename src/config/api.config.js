// API Configuration
// Update this based on your environment
import Constants from "expo-constants";

/**
 * Get the appropriate API base URL based on the platform
 *
 * Platform-specific URLs:
 * - Web (browser): http://localhost:5000/api
 * - iOS Simulator: http://localhost:5000/api
 * - Android Emulator: http://10.0.2.2:5000/api
 * - Real Device: http://YOUR_COMPUTER_IP:5000/api (e.g., http://192.168.1.5:5000/api)
 * 
 * Configuration priority:
 * 1. EXPO_PUBLIC_API_URL environment variable
 * 2. API_URL from app.json extra section
 * 3. null (will show error message)
 */

export const getApiBaseUrl = () => {
  // Check environment variable first
  let apiUrl = process.env.EXPO_PUBLIC_API_URL;
  
  // If not found, try to get from Constants (app.json extra section)
  if (!apiUrl && typeof Constants !== 'undefined') {
    try {
      apiUrl = Constants.expoConfig?.extra?.API_URL;
    } catch (e) {
      // Constants might not be available in all contexts
    }
  }
  
  if (apiUrl) {
    // Remove trailing slash if present
    apiUrl = apiUrl.replace(/\/$/, '');
    // Add /api if not already present
    return apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;
  }
  
  // Fallback for local development
  return null;
};

// For real devices, uncomment and set your computer's IP address:
// export const API_BASE_URL = 'http://192.168.1.X:5000/api';

export const API_BASE_URL = getApiBaseUrl();

// Enable debug logging
export const API_DEBUG = true;
