# Code Examples & Quick Reference

## 1. Using the API Service

### Fetch All Audio
```javascript
import apiService from '../services/apiService';

// Get all audio with transformation
const audioList = await apiService.fetchFormattedAudio();

// Use raw data from API
const rawData = await apiService.fetchAllAudio();
```

### Fetch by Category
```javascript
// Fetch and transform by category
const categoryAudio = await apiService.fetchFormattedAudioByCategory('General');

// Raw API response
const rawCategoryData = await apiService.fetchAudioByCategory('General');
```

### Fetch Single Audio
```javascript
// Get single audio by ID
const singleAudio = await apiService.fetchAudioById('696919b82ba12988954a0a4e');
```

### Manual Data Transformation
```javascript
// Transform backend format to frontend format
const backendAudio = {
  _id: "696919b8...",
  title: "My Track",
  category: "General",
  duration: 30,
  audioUrl: "s3://bucket-name/file.mp3"
};

const transformedAudio = apiService.transformAudioData(backendAudio);
// Result:
// {
//   id: "696919b8...",
//   title: "My Track",
//   artist: "Unknown Artist",
//   category: "General",
//   duration: "0:30",
//   durationSeconds: 30,
//   uri: "s3://bucket-name/file.mp3"
// }
```

## 2. Using MusicListScreen

### Navigation with Category
```javascript
import { useNavigation } from '@react-navigation/native';

export default function MyComponent() {
  const navigation = useNavigation();

  return (
    <Pressable 
      onPress={() => navigation.navigate('MusicList', { 
        category: 'General' 
      })}
    >
      <Text>View General Music</Text>
    </Pressable>
  );
}
```

### Navigation Without Category
```javascript
// Load all music
navigation.navigate('MusicList');

// Or with explicit parameter
navigation.navigate('MusicList', { category: 'All' });
```

## 3. Error Handling

### In Your Components
```javascript
import apiService from '../services/apiService';

export default function MyScreen() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const audioData = await apiService.fetchFormattedAudio();
        if (!audioData || audioData.length === 0) {
          setError('No audio data available');
          return;
        }
        setData(audioData);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load audio:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;
  
  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <Text>{item.title}</Text>}
      keyExtractor={(item) => item.id}
    />
  );
}
```

## 4. Extended Usage Examples

### With Category Filtering
```javascript
import apiService from '../services/apiService';

async function loadCategoryMusic(category) {
  try {
    // Method 1: Filter server-side
    const data = await apiService.fetchFormattedAudioByCategory(category);
    
    // Method 2: Filter client-side
    const allData = await apiService.fetchFormattedAudio();
    const filtered = allData.filter(item => 
      item.category.toLowerCase() === category.toLowerCase()
    );
    
    return data; // Server-side filtered is more efficient
  } catch (error) {
    console.error('Category fetch failed:', error);
    return [];
  }
}
```

### With Retry Logic
```javascript
async function fetchWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiService.fetchFormattedAudio();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### With Caching
```javascript
let cachedData = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchAudioWithCache() {
  const now = Date.now();
  
  // Return cached data if still fresh
  if (cachedData && cacheTime && (now - cacheTime) < CACHE_DURATION) {
    return cachedData;
  }
  
  // Fetch fresh data
  const data = await apiService.fetchFormattedAudio();
  cachedData = data;
  cacheTime = now;
  
  return data;
}
```

## 5. Common Patterns

### Pattern 1: Load on Mount
```javascript
useEffect(() => {
  const loadData = async () => {
    const data = await apiService.fetchFormattedAudio();
    setMusicList(data);
  };
  
  loadData();
}, []);
```

### Pattern 2: Load on Category Change
```javascript
useEffect(() => {
  const loadData = async () => {
    if (category === 'All') {
      const data = await apiService.fetchFormattedAudio();
      setMusicList(data);
    } else {
      const data = await apiService.fetchFormattedAudioByCategory(category);
      setMusicList(data);
    }
  };
  
  loadData();
}, [category]); // Re-run when category changes
```

### Pattern 3: Load with Refresh
```javascript
const [refreshing, setRefreshing] = useState(false);

const handleRefresh = async () => {
  setRefreshing(true);
  try {
    const data = await apiService.fetchFormattedAudio();
    setMusicList(data);
  } finally {
    setRefreshing(false);
  }
};

return (
  <FlatList
    data={musicList}
    onRefresh={handleRefresh}
    refreshing={refreshing}
    renderItem={renderItem}
  />
);
```

## 6. Data Structure Reference

### Audio Object Structure
```javascript
{
  // From Backend
  id: string,              // Unique identifier (_id from DB)
  title: string,           // Track title
  category: string,        // Category name
  duration: string,        // Formatted MM:SS
  durationSeconds: number, // Duration in seconds
  uri: string,             // Audio file URL (audioUrl from API)
  createdAt: string,       // ISO timestamp
  artist: string,          // Artist name (or "Unknown Artist")
  
  // Original fields preserved
  _id: string,
  audioUrl: string,
  ...otherFields
}
```

## 7. Environment Configuration

### Development
```javascript
// .env or config file
API_BASE_URL=http://localhost:5000/api
```

### Production
```javascript
// .env or config file
API_BASE_URL=https://api.yourdomain.com/api
```

### Using Environment Variables
```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
```

## 8. Testing the API Service

### Jest Test Example
```javascript
import apiService from '../services/apiService';

describe('apiService', () => {
  test('fetchAllAudio returns array', async () => {
    const data = await apiService.fetchAllAudio();
    expect(Array.isArray(data)).toBe(true);
  });

  test('transformAudioData handles missing fields', () => {
    const result = apiService.transformAudioData({ title: 'Test' });
    expect(result.artist).toBe('Unknown Artist');
    expect(result.category).toBe('General');
  });

  test('fetchFormattedAudio transforms data', async () => {
    const data = await apiService.fetchFormattedAudio();
    if (data.length > 0) {
      const item = data[0];
      expect(item.id).toBeDefined();
      expect(item.uri).toBeDefined();
      expect(item.duration).toMatch(/^\d+:\d{2}$/); // MM:SS format
    }
  });
});
```

## 9. Debugging Tips

### Enable Verbose Logging
```javascript
// Add to apiService.js
const DEBUG = true;

async fetchAllAudio() {
  if (DEBUG) console.log('Fetching from:', API_BASE_URL + '/audio');
  
  try {
    const response = await fetch(...);
    if (DEBUG) console.log('Response:', response);
    ...
  } catch (error) {
    if (DEBUG) console.error('Error:', error);
    ...
  }
}
```

### Test API Endpoints
```javascript
// In browser console or Postman
fetch('http://localhost:5000/api/audio')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

## 10. Common Issues & Solutions

### Issue: "Cannot read property 'data' of undefined"
```javascript
// BAD
const title = result.data.title;

// GOOD
const title = result?.data?.title || 'Untitled';
```

### Issue: Duration shows as "NaN:NaN"
```javascript
// Ensure duration is a number
const durationSeconds = parseInt(backendAudio.duration) || 0;
```

### Issue: Audio URL is invalid
```javascript
// Verify audioUrl exists and is valid
console.log('Audio URL:', backendAudio.audioUrl);
// Should be: s3://... or http://... or https://...
```
