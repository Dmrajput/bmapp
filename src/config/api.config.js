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
  return 'http://10.82.24.62:5000/api';
//   return 'http://localhost:5000/api';
//   if (typeof window !== 'undefined' && window.location) {
//     return 'http://localhost:5000/api';
//   }
  
//   // For React Native
//   if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
//     // Detect platform
//     const Platform = require('react-native').Platform;
    
//     if (Platform.OS === 'android') {
//       // Android emulator uses special alias to access host machine
//       return 'http://10.82.24.62:5000/api';
//     } else if (Platform.OS === 'ios') {
//       // iOS simulator can use localhost
//       return 'http://localhost:5000/api';
//     }
//   }
  
//   // Default fallback
//   return 'http://localhost:5000/api';
};

// For real devices, uncomment and set your computer's IP address:
// export const API_BASE_URL = 'http://192.168.1.X:5000/api';

export const API_BASE_URL = getApiBaseUrl();

// Enable debug logging
export const API_DEBUG = true;
