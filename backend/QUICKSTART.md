# 🚀 Quick Start Guide

## Step-by-Step Setup

### 1. Install MongoDB

**Windows:**
- Download from https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

**Mac:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment
```bash
# Copy example env
cp .env.example .env

# Edit .env with your settings
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/music-app

# For MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/music-app
```

### 4. Seed Sample Data
```bash
npm run seed
```

You should see:
```
✅ MongoDB Connected
📥 Inserting sample music data...
✅ Successfully seeded 16 music tracks
```

### 5. Start Server
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
📊 Database: music-app
🚀 Server is running on port 5000
📍 API Base URL: http://localhost:5000
```

### 6. Test API

Open browser or use curl:
```bash
# Health check
http://localhost:5000/

# Get all music
http://localhost:5000/api/music

# Get trending
http://localhost:5000/api/music/trending

# Get by category
http://localhost:5000/api/music/category/Cinematic
```

## 🎯 Next Steps

1. **Test all endpoints** using Postman or cURL
2. **Connect your React Native frontend**
3. **Add more sample data** via POST requests
4. **Customize categories** to match your needs

## 📱 Connect to React Native

Update your API base URL:

```javascript
// For iOS Simulator
const API_BASE_URL = 'http://localhost:5000/api/music';

// For Android Emulator
const API_BASE_URL = 'http://10.0.2.2:5000/api/music';

// For Physical Device (use your computer's IP)
const API_BASE_URL = 'http://192.168.1.100:5000/api/music';
```

## ✅ Verification Checklist

- [ ] MongoDB is running
- [ ] Dependencies installed (`node_modules` folder exists)
- [ ] `.env` file created with correct MONGODB_URI
- [ ] Sample data seeded successfully
- [ ] Server starts without errors
- [ ] Can access http://localhost:5000/ in browser
- [ ] Can fetch music from http://localhost:5000/api/music

## 🐛 Common Issues

**Port 5000 in use?**
```bash
# Change PORT in .env
PORT=3000
```

**MongoDB connection failed?**
```bash
# Check MongoDB is running
mongod --version

# Start MongoDB
mongod
```

**Dependencies error?**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

Happy Coding! 🎵
