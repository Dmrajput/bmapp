# 🎵 BM App - Music Streaming App

This is an [Expo](https://expo.dev) project for a music streaming application with **dynamic backend API integration**.

## 🚀 Quick Start

### Prerequisites

- Node.js installed
- Backend server running on `localhost:5000`

### Installation

```bash
# Install dependencies
npm install

# In another terminal, start the backend
cd backend
npm install
npm start
```

### Start the App

```bash
npm start
# Press 'w' for web, 'a' for Android, 'i' for iOS
```

## ✨ Features

✅ **Dynamic Music Loading** - Fetches tracks from your backend database  
✅ **Category Filtering** - Browse music by category  
✅ **Full Playback** - Play, pause, and select duration (15s/30s/60s)  
✅ **Mini-Player** - Convenient controls at the bottom  
✅ **Error Handling** - Graceful fallback if backend is unavailable  
✅ **Responsive Design** - Works on web, iOS, and Android  
✅ **Auth Flow** - Welcome, Signup, Login with secure token storage  
✅ **Favorites Sync** - Save tracks across sessions

## 📚 Documentation

### Getting Started

- [QUICK_START.md](./QUICK_START.md) - Get up and running in 5 minutes
- [FINAL_SUMMARY.md](./FINAL_SUMMARY.md) - Complete overview of the integration

### Comprehensive Guides

- [API_INTEGRATION.md](./API_INTEGRATION.md) - Full integration reference
- [CODE_EXAMPLES.md](./CODE_EXAMPLES.md) - Copy-paste code examples
- [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) - Visual system design

### Verification & Support

- [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md) - Verify everything works
- [VISUAL_SUMMARY.md](./VISUAL_SUMMARY.md) - Visual overview
- [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) - Navigation guide

## 🎯 How It Works

```
Your Backend API (localhost:5000)
            ↓
   Music Tracks from Database
            ↓
     apiService (Frontend)
            ↓
    Data Transformation
            ↓
    MusicListScreen (UI)
            ↓
  User Plays Music! 🎧
```

## 🔧 Tech Stack

- **Frontend:** React Native with Expo
- **UI Framework:** React Navigation
- **Audio Playback:** expo-av
- **Styling:** StyleSheet
- **Backend:** Node.js + Express (see backend folder)
- **Database:** MongoDB

## 📱 Development

### Project Structure

```
BMApp/
├── app/                          # App screens (Expo Router)
├── src/
│   ├── screens/                  # Screen components
│   │   └── MusicListScreen.js    # Main music list (API integration)
│   ├── services/
│   │   └── apiService.js         # API communication layer
│   ├── data/
│   │   └── musicList.js          # Fallback static data
│   └── components/               # Reusable components
├── backend/                      # Backend API server
└── Documentation guides (*.md)
```

### API Endpoints

- `GET /api/audio` - Fetch all tracks
- `GET /api/audio?category=General` - Fetch by category
- `GET /api/audio/:id` - Fetch single track
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google auth (stub)
- `POST /api/auth/refresh` - Refresh token

## 🧪 Testing

### Verify Integration

1. **Check backend is running:**

   ```bash
   curl http://localhost:5000/api/audio
   ```

2. **Start the app:**

   ```bash
   npm start
   ```

3. **Navigate to music list** and verify tracks load from database

4. **Test playback** by tapping Play button

## 🐛 Troubleshooting

### "No tracks found"

- Ensure backend is running: `npm start` in backend folder
- Check database has audio records

### Tracks don't load

- Open browser console (F12)
- Look for error messages
- Verify API response at `http://localhost:5000/api/audio`

### Audio won't play

- Verify `audioUrl` is valid S3 URL
- Check S3 bucket permissions

For more troubleshooting: See [QUICK_START.md](./QUICK_START.md) → Troubleshooting

## 📖 Learn More

- [API Integration Guide](./API_INTEGRATION.md) - Complete reference
- [Code Examples](./CODE_EXAMPLES.md) - Practical patterns
- [Architecture Diagrams](./ARCHITECTURE_DIAGRAMS.md) - System design
- [Expo Documentation](https://docs.expo.dev/)

## 🚀 Deployment

For production deployment:

1. Update `API_BASE_URL` in `src/services/apiService.js`
2. Use environment variables for different environments
3. Deploy backend to production server
4. Build and deploy mobile app

See [QUICK_START.md](./QUICK_START.md) → Configuration section

## 📝 Recent Changes (January 15, 2026)

### Implementation

- ✅ Created `src/services/apiService.js` - Complete API service
- ✅ Updated `src/screens/MusicListScreen.js` - API integration
- ✅ Updated `src/data/musicList.js` - Fallback data

### Documentation

- ✅ Created comprehensive guides (2,050+ lines)
- ✅ Added 50+ code examples
- ✅ Created architecture diagrams
- ✅ Added troubleshooting guide

## 🤝 Contributing

Feel free to open issues and create pull requests for improvements.

## 📄 License

This project is part of BM App development.

---

**Status:** ✅ Production Ready  
**Last Updated:** January 15, 2026  
**Version:** 1.0.0
