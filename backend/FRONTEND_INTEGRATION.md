# 🔗 Connecting React Native Frontend to Backend

## 📱 Frontend Configuration

### Step 1: Determine Your API URL

Choose the correct URL based on your development setup:

```javascript
// For iOS Simulator (Mac)
const API_BASE_URL = 'http://localhost:5000/api/music';

// For Android Emulator
const API_BASE_URL = 'http://10.0.2.2:5000/api/music';

// For Physical Device (same WiFi network)
// Replace with your computer's local IP address
const API_BASE_URL = 'http://192.168.1.100:5000/api/music';

// For Expo Go on physical device
// Use your computer's local network IP
const API_BASE_URL = 'http://YOUR_LOCAL_IP:5000/api/music';
```

### Step 2: Find Your Local IP Address

**Windows:**
```powershell
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
```

**Mac/Linux:**
```bash
ifconfig
# Look for "inet" under en0 or wlan0
```

---

## 🎯 Update Your Music Data Source

### Current (Local Data)
```javascript
// src/data/musicList.js
const musicList = [
  { id: '1', title: 'Sunny Groove', ... }
];
```

### New (API Data)
Create a new API service file:

```javascript
// src/services/musicApi.js
const API_BASE_URL = 'http://10.0.2.2:5000/api/music'; // Adjust for your setup

export const musicApi = {
  // Get all music
  async getAllMusic() {
    try {
      const response = await fetch(API_BASE_URL);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching music:', error);
      return [];
    }
  },

  // Get music by category
  async getMusicByCategory(category) {
    try {
      // Clean category name (remove emojis, special chars)
      const cleanCategory = category.replace(/[^\w\s-]/g, '').trim();
      
      const response = await fetch(`${API_BASE_URL}/category/${cleanCategory}`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching category music:', error);
      return [];
    }
  },

  // Get trending music
  async getTrendingMusic(limit = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/trending?limit=${limit}`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching trending:', error);
      return [];
    }
  },

  // Like a music track
  async likeMusic(musicId) {
    try {
      const response = await fetch(`${API_BASE_URL}/${musicId}/like`, {
        method: 'PATCH',
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error liking music:', error);
      return { success: false };
    }
  },
};
```

---

## 🔧 Update MusicListScreen

Replace the local data with API calls:

```javascript
// src/screens/MusicListScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import { musicApi } from '../services/musicApi';

export default function MusicListScreen({ route }) {
  const categoryParam = route?.params?.category || 'All';
  
  const [musicList, setMusicList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch music from API
  useEffect(() => {
    const fetchMusic = async () => {
      setLoading(true);
      try {
        let data;
        if (categoryParam === 'All') {
          data = await musicApi.getAllMusic();
        } else {
          data = await musicApi.getMusicByCategory(categoryParam);
        }
        setMusicList(data);
      } catch (error) {
        console.error('Error loading music:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMusic();
  }, [categoryParam]);
  
  // Rest of your component...
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3949ab" />
      </SafeAreaView>
    );
  }
  
  // Render your music list...
}
```

---

## 🎨 Update HomeScreen Navigation

Modify category click to pass clean category name:

```javascript
// src/screens/HomeScreen.js
const handleCategoryPress = (category) => {
  // Extract clean category name (remove emojis)
  const cleanName = category.name
    .replace(/[^\w\s-]/g, '') // Remove emojis
    .split('/')[0]            // Take first part if "/" exists
    .trim();                  // Remove whitespace
  
  router.push({
    pathname: '/music/[category]',
    params: { category: cleanName }
  });
};

// In your JSX:
<TouchableOpacity
  onPress={() => handleCategoryPress(category)}
>
```

---

## 🧪 Test Connection

### 1. Start Backend
```bash
cd backend
npm run dev
```

Should show:
```
✅ MongoDB Connected
🚀 Server is running on port 5000
```

### 2. Start Frontend
```bash
cd ..
npx expo start
```

### 3. Test in App
1. Open app on device/emulator
2. Tap any category card
3. Should load music from backend API
4. Check console for any errors

---

## 🐛 Troubleshooting

### "Network request failed"
- **Cause:** Backend not running or wrong URL
- **Fix:** 
  1. Ensure backend is running: `npm run dev`
  2. Check API_BASE_URL matches your setup
  3. For Android emulator, use `10.0.2.2` instead of `localhost`

### "Cannot connect to localhost"
- **Cause:** Using wrong IP for physical device
- **Fix:** 
  1. Find your computer's local IP
  2. Update API_BASE_URL to use that IP
  3. Ensure phone and computer on same WiFi

### "Empty music list"
- **Cause:** No data in database
- **Fix:** Run seed script: `npm run seed`

### CORS errors (unlikely with our setup)
- **Fix:** CORS is already enabled in backend

---

## 📊 Data Mapping

### Backend Response
```json
{
  "_id": "6789abcd1234567890efgh12",
  "title": "Epic Rise",
  "category": "Cinematic",
  "duration": "0:45",
  "audioUrl": "https://example.com/audio/epic-rise.mp3",
  "isPremium": true,
  "likes": 3200,
  "tags": ["epic", "cinematic"],
  "createdAt": "2026-01-11T10:30:00.000Z"
}
```

### Map to Frontend Format
```javascript
const formatMusicData = (apiData) => {
  return apiData.map(item => ({
    id: item._id,
    title: item.title,
    artist: item.category, // Or fetch from separate artist field
    duration: item.duration,
    uri: item.audioUrl,
    category: item.category,
    isPremium: item.isPremium,
    likes: item.likes,
  }));
};
```

---

## ✅ Verification Checklist

- [ ] Backend server is running
- [ ] MongoDB is running with seeded data
- [ ] Frontend API_BASE_URL is correct for your setup
- [ ] musicApi.js service created
- [ ] MusicListScreen updated to use API
- [ ] HomeScreen navigation passes clean category names
- [ ] Tested on emulator/device - music loads
- [ ] Category filtering works
- [ ] Audio playback works with API URLs

---

## 🚀 Production Deployment

When deploying to production:

1. **Backend:** Deploy to Heroku, Railway, or AWS
2. **Database:** Use MongoDB Atlas (cloud)
3. **Update Frontend:** Change API_BASE_URL to production URL
4. **Environment Variables:** Use .env for different environments

Example:
```javascript
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:5000/api/music' // Development
  : 'https://your-api.com/api/music'; // Production
```

---

## 📝 Example Complete Integration

```javascript
// src/services/musicApi.js - Complete service
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (__DEV__) {
    // Development
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api/music';
    }
    return 'http://localhost:5000/api/music';
  }
  // Production
  return 'https://your-production-api.com/api/music';
};

const API_BASE_URL = getBaseUrl();

export const musicApi = {
  async getAllMusic() {
    const response = await fetch(API_BASE_URL);
    const result = await response.json();
    return result.success ? result.data : [];
  },

  async getMusicByCategory(category) {
    const cleanCategory = category.replace(/[^\w\s-]/g, '').trim();
    const response = await fetch(`${API_BASE_URL}/category/${cleanCategory}`);
    const result = await response.json();
    return result.success ? result.data : [];
  },

  async getTrendingMusic(limit = 20) {
    const response = await fetch(`${API_BASE_URL}/trending?limit=${limit}`);
    const result = await response.json();
    return result.success ? result.data : [];
  },

  async likeMusic(musicId) {
    const response = await fetch(`${API_BASE_URL}/${musicId}/like`, {
      method: 'PATCH',
    });
    return await response.json();
  },
};
```

---

Happy Integration! 🎵🚀
