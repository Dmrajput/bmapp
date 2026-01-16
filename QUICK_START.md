# Quick Start Guide: Dynamic API Integration

## 🚀 Get Started in 5 Minutes

### Step 1: Verify Your Backend is Running
```bash
cd backend
npm start
# Should see: Server running on http://localhost:5000
```

### Step 2: Test the API Endpoint
Open your browser or Postman:
```
GET http://localhost:5000/api/audio
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Your Track Title",
      "category": "General",
      "duration": 30,
      "audioUrl": "s3://..."
    }
  ]
}
```

### Step 3: Start Your React Native App
```bash
npm start
# Press 'a' for Android, 'i' for iOS, or 'w' for web
```

### Step 4: Navigate to Music List
- Open the app
- Tap on a category (or "All")
- You should see:
  - Loading spinner briefly
  - Music tracks from your database
  - Play/pause controls
  - Duration selectors

### Step 5: Test Playback
- Tap "Play" on any track
- Mini-player should appear at bottom
- Audio should play (if audioUrl is valid S3 URL)

---

## ✅ Checklist

- [ ] Backend is running on `localhost:5000`
- [ ] `/api/audio` endpoint returns data
- [ ] React Native app starts without errors
- [ ] Music tracks display from database
- [ ] Loading spinner appears during fetch
- [ ] Play button works with database tracks
- [ ] Category filtering works
- [ ] No console errors

---

## 🐛 Troubleshooting

### Issue: "No tracks found" message appears
**Solution:**
1. Check backend is running: `npm start` in backend folder
2. Check database has audio records: `db.audios.find()` in MongoDB
3. Verify API response: Visit `http://localhost:5000/api/audio` in browser

### Issue: Tracks not loading, but no error
**Solution:**
1. Open console: Press F12 in browser (web) or check Expo console
2. Look for error messages with details
3. Check API response format matches expected schema
4. Verify `audioUrl` field exists in database records

### Issue: Play button doesn't work
**Solution:**
1. Ensure `audioUrl` is valid S3 URL: `s3://bucket-name/file.mp3`
2. Test URL is accessible: Try opening it in browser
3. Check S3 bucket permissions allow access
4. Verify using HTTP/HTTPS, not just s3:// protocol

### Issue: App crashes when loading
**Solution:**
1. Clear app cache
2. Rebuild: `npm start -- --clear`
3. Check console for specific error message
4. Verify all imports are correct

### Issue: Fallback data always showing (not API data)
**Solution:**
1. Open browser console/Expo console
2. Look for API error logs
3. Check network tab to see API request
4. Verify backend URL is correct: `http://localhost:5000/api`

---

## 📝 Key Files Modified

| File | What Changed | Location |
|------|--------------|----------|
| `MusicListScreen.js` | Added API fetching & loading state | `src/screens/` |
| `apiService.js` | Created new API service | `src/services/` |
| `musicList.js` | Renamed to staticMusicList (fallback) | `src/data/` |

---

## 🔧 Configuration

### Change API URL
Edit `src/services/apiService.js` line 3:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

### For Production
```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
```

---

## 📊 How It Works

```
User opens app
     ↓
App loads MusicListScreen
     ↓
Component calls apiService.fetchFormattedAudio()
     ↓
API fetches from http://localhost:5000/api/audio
     ↓
Data transforms (backend format → frontend format)
     ↓
UI updates with music tracks
     ↓
User can play, pause, select duration
```

---

## 🎯 Common Tasks

### View API Response
```bash
# In terminal
curl http://localhost:5000/api/audio

# Or use PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/audio" | ConvertFrom-Json
```

### Fetch Specific Category
```bash
curl http://localhost:5000/api/audio?category=General
```

### Test in Browser Console
```javascript
fetch('http://localhost:5000/api/audio')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e))
```

### Check MongoDB Records
```bash
# In MongoDB shell
use database_name
db.audios.find().pretty()
db.audios.count()
```

---

## 🔄 Data Format Reference

**Your API sends:**
```json
{
  "success": true,
  "data": {
    "_id": "696919b82ba12988954a0a4e",
    "title": "Track Name",
    "category": "General",
    "duration": 30,
    "audioUrl": "s3://my-bucket/audio.mp3",
    "createdAt": "2026-01-15T16:45:44.657Z"
  }
}
```

**App transforms to:**
```json
{
  "id": "696919b82ba12988954a0a4e",
  "title": "Track Name",
  "category": "General",
  "duration": "0:30",
  "durationSeconds": 30,
  "uri": "s3://my-bucket/audio.mp3",
  "artist": "Unknown Artist",
  "createdAt": "2026-01-15T16:45:44.657Z"
}
```

---

## 📱 Testing on Different Platforms

### Web
```bash
npm start
# Press 'w'
# Opens http://localhost:19006
```

### iOS (Mac only)
```bash
npm start
# Press 'i'
# Opens in iOS simulator
```

### Android
```bash
npm start
# Press 'a'
# Opens in Android emulator (or connected device)
```

---

## 🚨 Emergency Help

If nothing is working:

1. **Check Backend**
   ```bash
   cd backend
   npm start
   # Should show: Server running on http://localhost:5000
   ```

2. **Test API Directly**
   ```
   Visit: http://localhost:5000/api/audio
   Should return JSON with "success": true
   ```

3. **Clear Cache & Rebuild**
   ```bash
   npm start -- --clear
   ```

4. **Check Console Logs**
   - Web: F12 → Console tab
   - Mobile: Expo Go app shows logs
   - Backend: Terminal where `npm start` is running

5. **Restart Everything**
   - Stop backend: Ctrl+C
   - Stop app: Ctrl+C
   - Clear cache: `npm start -- --clear`
   - Restart backend: `npm start`
   - Restart app: `npm start`

---

## 📚 Additional Resources

- **Full Guide:** See `API_INTEGRATION.md`
- **Code Examples:** See `CODE_EXAMPLES.md`
- **Architecture:** See `ARCHITECTURE_DIAGRAMS.md`
- **Implementation Details:** See `IMPLEMENTATION_SUMMARY.md`

---

## ✨ What's Next?

After verifying everything works:

1. **Add Pull-to-Refresh** - Swipe down to reload
2. **Add Search** - Find tracks by name
3. **Add Favorites** - Save favorite tracks
4. **Add Analytics** - Track which songs are played
5. **Add Pagination** - Load more tracks on scroll

---

## 📞 Need Help?

Check your console for error messages. They usually tell you exactly what's wrong:
- "Cannot fetch from localhost:5000" → Backend not running
- "Cannot read property 'audioUrl'" → Data format mismatch
- "Sound failed to load" → Invalid S3 URL

Read the full guides for detailed solutions!
