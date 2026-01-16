# Dynamic API Integration Guide

## Overview
Your app now fetches dynamic music data from the backend API instead of using static data. The integration includes fallback mechanisms and error handling.

## Key Changes

### 1. **New API Service** (`src/services/apiService.js`)
Complete API communication layer with methods:
- `fetchAllAudio()` - Get all audio tracks
- `fetchAudioByCategory(category)` - Get tracks by category
- `fetchAudioById(id)` - Get single track
- `fetchFormattedAudio()` - Get all audio with transformed data
- `fetchFormattedAudioByCategory(category)` - Get category audio with transformation
- `transformAudioData(backendAudio)` - Convert backend format to frontend format

**Base URL:** `http://localhost:5000/api`

### 2. **Updated MusicListScreen** (`src/screens/MusicListScreen.js`)
- Added dynamic data fetching on component mount
- Implements loading state with spinner
- Automatic category-based API calls
- Fallback to static data if API fails
- Maintains all existing playback functionality

**Key State Variables:**
```javascript
const [musicList, setMusicList] = useState([]); // Dynamic data from API
const [isLoadingData, setIsLoadingData] = useState(true); // API loading state
```

### 3. **Data Transformation**
Backend response format → Frontend format:

**Backend Format (from API):**
```json
{
  "title": "Untitled",
  "category": "General",
  "duration": 0,
  "audioUrl": "s3://buffer-1768495544656",
  "_id": "696919b82ba12988954a0a4e",
  "createdAt": "2026-01-15T16:45:44.657Z"
}
```

**Frontend Format (used by UI):**
```javascript
{
  id: "696919b82ba12988954a0a4e",
  title: "Untitled",
  artist: "Unknown Artist", // From backend.artist or default
  category: "General",
  duration: "0:00", // Formatted MM:SS
  durationSeconds: 0,
  uri: "s3://buffer-1768495544656", // audioUrl mapped to uri
  createdAt: "2026-01-15T16:45:44.657Z",
  // ...all original fields
}
```

## API Endpoints Used

### 1. Fetch All Audio
```
GET http://localhost:5000/api/audio
Response: { success: true, data: [Array of audio objects] }
```

### 2. Fetch by Category
```
GET http://localhost:5000/api/audio?category=General
Response: { success: true, data: [Array of audio objects] }
```

### 3. Fetch Single Audio
```
GET http://localhost:5000/api/audio/:id
Response: { success: true, data: [Audio object] }
```

## Data Flow

```
User Opens App
    ↓
MusicListScreen Mounts
    ↓
useEffect Triggers
    ↓
Check Category Parameter
    ↓
API Call (fetchFormattedAudio or fetchFormattedAudioByCategory)
    ↓
Transform Data (if successful)
    ↓
Set musicList State
    ↓
UI Renders with dynamic data
    ↓
If API fails → Use staticMusicList as fallback
```

## Error Handling

The app handles errors gracefully:
- **API Failure:** Falls back to static data from `musicList.js`
- **Empty Response:** Uses fallback static list
- **Network Error:** Automatic retry on component remount
- **Console Logs:** All errors logged for debugging

```javascript
try {
  // Fetch from API
  data = await apiService.fetchFormattedAudio();
  if (data && data.length > 0) {
    setMusicList(data);
  } else {
    setMusicList(staticMusicList); // Fallback
  }
} catch (error) {
  console.error('Error loading music data:', error);
  setMusicList(staticMusicList); // Fallback on error
}
```

## Loading UI

Added loading indicator while fetching data:
- Shows spinner and "Loading music..." text
- Displays while `isLoadingData` is true
- Smooth transition to content once data loads

## Features Maintained

✅ Play/Pause functionality
✅ Duration selection (15s, 30s, 60s)
✅ Mini-player at bottom
✅ Category filtering
✅ Single track playback (no overlapping audio)
✅ Responsive loading states

## Next Steps (Optional)

1. **Update Backend Routes** - Ensure your backend API returns data in expected format
2. **Add Pull-to-Refresh** - Implement `react-native-gesture-handler` for refresh
3. **Pagination** - Add support for large datasets
4. **Search** - Add search functionality
5. **Caching** - Implement local caching for offline support
6. **Analytics** - Track which tracks are played most

## Testing

To test the integration:
1. Start your backend server on `localhost:5000`
2. Ensure the API endpoints respond with the expected JSON format
3. Launch the app and check console for any errors
4. Verify data loads and displays correctly
5. Test category filtering by navigating through categories
6. Test play/pause functionality with the dynamic data

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Data not loading | Check if backend is running on `localhost:5000` |
| "No tracks found" | Verify backend API has audio records in database |
| Static data always showing | Check browser console for API error messages |
| Category not filtering | Ensure backend returns correct `category` field |
| Play button not working | Check if `audioUrl` is valid S3 URL |

## Configuration

To change the API base URL, edit `src/services/apiService.js`:

```javascript
const API_BASE_URL = 'http://localhost:5000/api'; // Change this
```

For production, use environment variables:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
```
