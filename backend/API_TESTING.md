# 🧪 API Testing Examples

## Using cURL (Command Line)

### 1. Health Check
```bash
curl http://localhost:5000/
```

### 2. Get All Music
```bash
curl http://localhost:5000/api/music
```

### 3. Get Music by Category
```bash
# Cinematic
curl http://localhost:5000/api/music/category/Cinematic

# Funny
curl http://localhost:5000/api/music/category/Funny

# Trending
curl http://localhost:5000/api/music/category/Trending

# Lofi
curl http://localhost:5000/api/music/category/Lofi
```

### 4. Get Trending Music
```bash
# Top 10 trending
curl http://localhost:5000/api/music/trending?limit=10

# Top 5 trending
curl http://localhost:5000/api/music/trending?limit=5
```

### 5. Add New Music
```bash
curl -X POST http://localhost:5000/api/music \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Track",
    "category": "Pop",
    "duration": "0:30",
    "audioUrl": "https://example.com/audio/new-track.mp3",
    "isPremium": false,
    "tags": ["pop", "upbeat", "2026"]
  }'
```

### 6. Like a Music Track
```bash
# Replace {MUSIC_ID} with actual ID from previous responses
curl -X PATCH http://localhost:5000/api/music/{MUSIC_ID}/like
```

### 7. Delete Music
```bash
# Replace {MUSIC_ID} with actual ID
curl -X DELETE http://localhost:5000/api/music/{MUSIC_ID}
```

---

## Using PowerShell (Windows)

### 1. Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/" -Method Get
```

### 2. Get All Music
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/music" -Method Get
```

### 3. Get by Category
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/music/category/Cinematic" -Method Get
```

### 4. Add Music
```powershell
$body = @{
    title = "My New Track"
    category = "Pop"
    duration = "0:30"
    audioUrl = "https://example.com/audio/new-track.mp3"
    isPremium = $false
    tags = @("pop", "upbeat")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/music" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### 5. Like Music
```powershell
# Replace MUSIC_ID
Invoke-RestMethod -Uri "http://localhost:5000/api/music/MUSIC_ID/like" -Method Patch
```

---

## Using JavaScript (React Native Frontend)

### Setup API Client
```javascript
const API_BASE_URL = 'http://localhost:5000/api/music';

// For Android Emulator, use: http://10.0.2.2:5000/api/music
// For physical device, use your computer's IP
```

### 1. Get All Music
```javascript
const getAllMusic = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data; // Array of music
    }
  } catch (error) {
    console.error('Error fetching music:', error);
  }
};
```

### 2. Get Music by Category
```javascript
const getMusicByCategory = async (category) => {
  try {
    const response = await fetch(`${API_BASE_URL}/category/${category}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Usage
const cinematicMusic = await getMusicByCategory('Cinematic');
```

### 3. Get Trending Music
```javascript
const getTrendingMusic = async (limit = 20) => {
  try {
    const response = await fetch(`${API_BASE_URL}/trending?limit=${limit}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 4. Add New Music
```javascript
const addMusic = async (musicData) => {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(musicData),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error adding music:', error);
  }
};

// Usage
await addMusic({
  title: 'New Track',
  category: 'Pop',
  duration: '0:30',
  audioUrl: 'https://example.com/audio/track.mp3',
  tags: ['pop', 'new']
});
```

### 5. Like Music
```javascript
const likeMusic = async (musicId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${musicId}/like`, {
      method: 'PATCH',
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error liking music:', error);
  }
};
```

### 6. Delete Music
```javascript
const deleteMusic = async (musicId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${musicId}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting music:', error);
  }
};
```

---

## Sample Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Music fetched successfully",
  "count": 15,
  "data": [...]
}
```

### Error Response (400)
```json
{
  "success": false,
  "message": "Please provide title, category, and audioUrl"
}
```

### Error Response (404)
```json
{
  "success": false,
  "message": "Music not found"
}
```

### Error Response (500)
```json
{
  "success": false,
  "message": "Server error while fetching music",
  "error": "Detailed error message"
}
```

---

## Postman Collection

Create a new Postman collection with these requests:

1. **GET** Health Check - `http://localhost:5000/`
2. **GET** Get All Music - `http://localhost:5000/api/music`
3. **GET** Get by Category - `http://localhost:5000/api/music/category/Cinematic`
4. **GET** Get Trending - `http://localhost:5000/api/music/trending?limit=10`
5. **POST** Add Music - `http://localhost:5000/api/music`
6. **PATCH** Like Music - `http://localhost:5000/api/music/{id}/like`
7. **DELETE** Delete Music - `http://localhost:5000/api/music/{id}`

---

## Testing Workflow

1. **Start MongoDB**
2. **Start Backend Server** - `npm run dev`
3. **Seed Data** - `npm run seed` (if needed)
4. **Test Health Check** - Should return API info
5. **Test Get All Music** - Should return array of music
6. **Test Category Filter** - Try different categories
7. **Test Trending** - Should return music sorted by likes
8. **Test Add Music** - Create a new track
9. **Test Like** - Increment likes on a track
10. **Test Delete** - Remove a track

---

Happy Testing! 🎵
