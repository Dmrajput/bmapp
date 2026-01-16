# System Architecture & Data Flow Diagrams

## 1. Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      React Native App                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  MusicListScreen Component                             │    │
│  │  - Manages state (musicList, isLoadingData)           │    │
│  │  - Handles audio playback                             │    │
│  │  - Renders FlatList of tracks                         │    │
│  └─────────────────┬──────────────────────────────────────┘    │
│                    │                                            │
│                    │ imports                                    │
│                    ▼                                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  apiService.js                                         │    │
│  │  - fetchAllAudio()                                    │    │
│  │  - fetchAudioByCategory()                             │    │
│  │  - fetchAudioById()                                   │    │
│  │  - transformAudioData()                               │    │
│  │  - fetchFormattedAudio()                              │    │
│  │  - fetchFormattedAudioByCategory()                    │    │
│  └─────────────────┬──────────────────────────────────────┘    │
│                    │                                            │
│                    │ HTTP Fetch                                 │
│                    ▼                                            │
│              ┌──────────────┐                                  │
│              │ Network      │                                  │
│              └──────────────┘                                  │
│                    │                                            │
└────────────────────┼────────────────────────────────────────────┘
                     │
                     │ HTTP Request
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API                                │
│          http://localhost:5000/api/audio                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Express Routes                                        │    │
│  │  - GET /audio (all tracks)                             │    │
│  │  - GET /audio?category=X (by category)                 │    │
│  │  - GET /audio/:id (single track)                       │    │
│  └─────────────────┬──────────────────────────────────────┘    │
│                    │                                            │
│                    ▼                                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Controllers                                           │    │
│  │  - audio.controller.js                                │    │
│  │  - Fetches from DB                                     │    │
│  │  - Returns JSON response                               │    │
│  └─────────────────┬──────────────────────────────────────┘    │
│                    │                                            │
│                    ▼                                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  MongoDB Database                                      │    │
│  │  Collection: Audio                                     │    │
│  │  - _id, title, category, duration, audioUrl, etc.     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Data Transformation Flow

```
Backend Response
    │
    ├─── {
    │      success: true,
    │      data: {
    │        _id: "696919b8...",
    │        title: "Untitled",
    │        category: "General",
    │        duration: 0,
    │        audioUrl: "s3://buffer-...",
    │        createdAt: "2026-01-15T16:45:44.657Z",
    │        artist: "John Doe"  (optional)
    │      }
    │    }
    │
    ▼
apiService.transformAudioData()
    │
    ├─── Maps Fields:
    │      _id → id
    │      audioUrl → uri
    │      duration → duration (formatted MM:SS)
    │      duration → durationSeconds (numeric)
    │      artist → artist (or "Unknown Artist" if missing)
    │      category → category
    │
    ▼
Frontend State
    │
    ├─── {
    │      id: "696919b8...",
    │      title: "Untitled",
    │      category: "General",
    │      duration: "0:00",
    │      durationSeconds: 0,
    │      uri: "s3://buffer-...",
    │      artist: "John Doe",
    │      createdAt: "2026-01-15T16:45:44.657Z"
    │    }
    │
    ▼
Component Renders
    │
    └─── UI Shows: "Untitled" by "John Doe" in General category
```

## 3. Component Lifecycle & Data Loading

```
MusicListScreen mounts
         │
         ▼
Constructor & State Init
    ├─ musicList = []
    ├─ isLoadingData = true
    ├─ currentTrackId = null
    └─ isPlaying = false
         │
         ▼
useEffect Hook Triggered
    │
    ├─ Check categoryParam
    │  ├─ If "All" or empty
    │  │  └─ Call fetchFormattedAudio()
    │  │
    │  └─ If specific category
    │     └─ Call fetchFormattedAudioByCategory(category)
    │
    ▼
API Call in Progress
    ├─ isLoadingData = true
    ├─ Show spinner to user
    │
    ▼
API Response Received
    │
    ├─ Success (data.length > 0)
    │  ├─ setMusicList(data)
    │  └─ isLoadingData = false
    │
    └─ Failure (empty or error)
       ├─ setMusicList(staticMusicList)
       └─ isLoadingData = false
         │
         ▼
Component Re-renders
    │
    ├─ FlatList with musicList data
    ├─ User can see tracks
    ├─ User can play audio
    └─ User can select duration
```

## 4. User Interaction Flow

```
User Opens App
     │
     ▼
CategoryScreen or HomeScreen shows categories
     │
     ▼
User taps a category (e.g., "General")
     │
     └─► navigation.navigate('MusicList', { category: 'General' })
           │
           ▼
       MusicListScreen receives route params
           │
           ├─ categoryParam = 'General'
           │
           ▼
       useEffect Hook Runs
           │
           ├─ fetchFormattedAudioByCategory('General')
           │
           ▼
       API Call: GET /api/audio?category=General
           │
           ▼
       Backend Returns Audio Array
           │
           ▼
       UI Renders Tracks
           │
           ├─ Track 1: [Play] Title | Artist
           ├─ Track 2: [Play] Title | Artist
           └─ Track 3: [Play] Title | Artist
           │
           ▼
User Taps "Play" on Track 1
     │
     ├─ Audio.Sound loads track URI
     ├─ Audio plays from S3 (audioUrl)
     ├─ Mini-player appears at bottom
     └─ User can:
        ├─ Tap [Pause]
        ├─ Select 15s, 30s, or 60s duration
        └─ Tap another track to play different audio
```

## 5. Error Handling Flow

```
API Call Initiated
     │
     ▼
Network Request
     │
     ├─ Success (200 OK)
     │  │
     │  ▼
     │ Parse Response
     │  │
     │  ├─ Valid JSON with data
     │  │  └─► Use data
     │  │
     │  └─ Invalid or empty
     │     └─► Use fallback (staticMusicList)
     │
     └─ Failure (network error, timeout, etc.)
        │
        ▼
     Catch Error
        │
        ├─ Log error to console
        │
        ▼
     Use Fallback Data
        │
        └─► setMusicList(staticMusicList)
             │
             ▼
        UI Shows Fallback Tracks
             │
             └─ User still sees something to play with
```

## 6. State Management Diagram

```
Component State
├─ musicList: Audio[]
│  └─ Populated from API response
│
├─ isLoadingData: boolean
│  ├─ true: While fetching from API
│  └─ false: After fetch complete or failed
│
├─ currentTrackId: string | null
│  └─ ID of currently playing track
│
├─ isPlaying: boolean
│  ├─ true: Audio is playing
│  └─ false: Audio is paused/stopped
│
├─ isLoadingSound: boolean
│  ├─ true: Loading audio from file
│  └─ false: Audio loaded or failed
│
├─ selectedDurations: object
│  └─ { [trackId]: durationInSeconds }
│     Example: { "123": 30, "456": 15 }
│
└─ soundRef: useRef
   └─ Holds Audio.Sound instance for playback
```

## 7. API Response Format Examples

### Success Response
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": [
    {
      "_id": "696919b82ba12988954a0a4e",
      "title": "Untitled",
      "category": "General",
      "duration": 0,
      "audioUrl": "s3://buffer-1768495544656",
      "createdAt": "2026-01-15T16:45:44.657Z",
      "__v": 0
    },
    {
      "_id": "696919b82ba12988954a0a4f",
      "title": "My Track",
      "category": "General",
      "duration": 45,
      "audioUrl": "s3://buffer-1768495544657",
      "createdAt": "2026-01-15T16:45:45.000Z",
      "__v": 0
    }
  ]
}
```

### Empty Response
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": []
}
```

### Error Response
```
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "success": false,
  "message": "Database connection failed"
}
```

## 8. Performance Optimization Flow

```
Initial Load (First Mount)
    ├─ Fetch from API
    ├─ Cache response
    └─ Display to user
         │
         ▼
Pull to Refresh
    ├─ Clear cache
    ├─ Fetch fresh data
    └─ Update UI
         │
         ▼
Category Change
    ├─ Check if cached
    ├─ If cached → use cache
    ├─ If not → fetch fresh
    └─ Update UI
```

## 9. File Structure Overview

```
BMApp/
├── src/
│   ├── screens/
│   │   ├── MusicListScreen.js ◄─── Fetches & displays data
│   │   └── ...
│   │
│   ├── services/
│   │   ├── apiService.js ◄─── API communication layer
│   │   └── audioService.js
│   │
│   ├── data/
│   │   └── musicList.js ◄─── Static fallback data
│   │
│   └── components/
│       └── ...
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── audio.routes.js ◄─── GET /api/audio
│   │   │   └── ...
│   │   │
│   │   ├── controllers/
│   │   │   └── audio.controller.js ◄─── Queries MongoDB
│   │   │
│   │   ├── models/
│   │   │   └── Audio.js ◄─── MongoDB schema
│   │   │
│   │   └── server.js ◄─── Express server
│   │
│   └── package.json
│
├── API_INTEGRATION.md ◄─── Complete guide
├── CODE_EXAMPLES.md ◄─── Usage examples
└── ...
```

## 10. Request/Response Timeline

```
Time    │ Event                              │ State
────────┼────────────────────────────────────┼──────────────────────
0ms     │ User navigates to MusicList        │ isLoadingData = true
        │ useEffect triggers                 │ musicList = []
────────┼────────────────────────────────────┼──────────────────────
10ms    │ apiService.fetchFormattedAudio()   │ (fetching...)
        │ → HTTP GET /api/audio              │
────────┼────────────────────────────────────┼──────────────────────
150ms   │ Network request sent               │ (network in flight)
        │ Backend receives request           │
────────┼────────────────────────────────────┼──────────────────────
160ms   │ Backend queries MongoDB            │ (processing...)
        │ Gets results                       │
────────┼────────────────────────────────────┼──────────────────────
170ms   │ Backend sends response             │ (response in flight)
        │ (200 OK + JSON data)               │
────────┼────────────────────────────────────┼──────────────────────
200ms   │ Frontend receives response         │ setMusicList(data)
        │ Data transformed                   │ isLoadingData = false
────────┼────────────────────────────────────┼──────────────────────
201ms   │ Component re-renders               │ FlatList shows tracks
        │ User sees music list               │ Ready to play
────────┴────────────────────────────────────┴──────────────────────
```
