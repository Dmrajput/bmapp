// API Configuration
// Update this based on your environment

/**
 * Get the appropriate API base URL based on the platform
 *
 * Platform-specific URLs:
 * - Web (browser): http://localhost:5000/api
 * - iOS Simulator: http://localhost:5000/api
 * - Android Emulator: http://10.0.2.2:5000/api
 * - Real Device: http://YOUR_COMPUTER_IP:5000/api (e.g., http://192.168.1.5:5000/api)
 */

export const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
  }
};

// For real devices, uncomment and set your computer's IP address:
// export const API_BASE_URL = 'http://192.168.1.X:5000/api';

export const API_BASE_URL = getApiBaseUrl();

// Enable debug logging
export const API_DEBUG = true;
