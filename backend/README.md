# 🎵 Music API Backend

Backend API for Background Music App - Built for short-video creators (Instagram Reels, YouTube Shorts, Moj)

## 📋 Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # MongoDB connection
│   ├── models/
│   │   └── Music.js          # Music schema
│   ├── controllers/
│   │   └── musicController.js # Business logic
│   ├── routes/
│   │   └── musicRoutes.js    # API routes
│   ├── middleware/
│   │   ├── errorHandler.js   # Error handling
│   │   └── notFound.js       # 404 handler
│   ├── utils/
│   │   └── seedData.js       # Sample data seeder
│   ├── app.js                # Express app setup
│   └── server.js             # Server entry point
├── .env                      # Environment variables
├── .env.example              # Example env file
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. **Navigate to backend folder**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   ```bash
   # Copy .env.example to .env
   cp .env.example .env

   # Edit .env and add your MongoDB URI
   ```

4. **Configure .env file**

   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/music-app
   JWT_SECRET=change_me_access
   JWT_REFRESH_SECRET=change_me_refresh
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   ```

# AWS S3 (required for /api/audio/upload)

AWS_ACCESS_KEY=your_access_key
AWS_SECRET_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your_bucket_name
CDN_URL=

````

5. **Start MongoDB** (if running locally)

```bash
mongod
````

6. **Seed sample data** (optional)

   ```bash
   npm run seed
   ```

7. **Start the server**

   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start
   ```

8. **Server will be running at**
   ```
   http://localhost:5000
   ```

## 📡 API Endpoints

### Base URL

```
http://localhost:5000/api/music
```

### Auth Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/refresh`

---

### 1. **Add New Music**

**Endpoint:** `POST /api/music`

**Request Body:**

```json
{
  "title": "Epic Rise",
  "category": "Cinematic",
  "duration": "0:45",
  "audioUrl": "https://example.com/audio/epic-rise.mp3",
  "isPremium": true,
  "tags": ["epic", "cinematic", "trailer"]
}
```

**Response:** (201 Created)

```json
{
  "success": true,
  "message": "Music added successfully",
  "data": {
    "_id": "6789abcd1234567890efgh12",
    "title": "Epic Rise",
    "category": "Cinematic",
    "duration": "0:45",
    "audioUrl": "https://example.com/audio/epic-rise.mp3",
    "isPremium": true,
    "likes": 0,
    "tags": ["epic", "cinematic", "trailer"],
    "createdAt": "2026-01-11T10:30:00.000Z",
    "updatedAt": "2026-01-11T10:30:00.000Z"
  }
}
```

---

### 2. **Get All Music**

**Endpoint:** `GET /api/music`

**Response:** (200 OK)

```json
{
  "success": true,
  "message": "Music fetched successfully",
  "count": 15,
  "data": [
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
  ]
}
```

---

### 3. **Get Music by Category**

**Endpoint:** `GET /api/music/category/:category`

**Example:** `GET /api/music/category/Cinematic`

**Response:** (200 OK)

```json
{
  "success": true,
  "message": "Music for category 'Cinematic' fetched successfully",
  "count": 2,
  "data": [
    {
      "_id": "6789abcd1234567890efgh12",
      "title": "Epic Rise",
      "category": "Cinematic",
      "duration": "0:45",
      "audioUrl": "https://example.com/audio/epic-rise.mp3",
      "isPremium": true,
      "likes": 3200,
      "tags": ["epic", "cinematic"]
    }
  ]
}
```

**Note:** Category search is case-insensitive

---

### 4. **Get Trending Music**

**Endpoint:** `GET /api/music/trending`

**Query Parameters:**

- `limit` (optional, default: 20)

**Example:** `GET /api/music/trending?limit=10`

**Response:** (200 OK)

```json
{
  "success": true,
  "message": "Trending music fetched successfully",
  "count": 10,
  "data": [
    {
      "_id": "6789abcd1234567890efgh12",
      "title": "Viral Beat 2024",
      "category": "Trending",
      "likes": 5600,
      "audioUrl": "https://example.com/audio/viral-beat.mp3"
    }
  ]
}
```

---

### 5. **Like Music**

**Endpoint:** `PATCH /api/music/:id/like`

**Example:** `PATCH /api/music/6789abcd1234567890efgh12/like`

**Response:** (200 OK)

```json
{
  "success": true,
  "message": "Music liked successfully",
  "data": {
    "_id": "6789abcd1234567890efgh12",
    "title": "Epic Rise",
    "likes": 3201,
    "category": "Cinematic"
  }
}
```

---

### 6. **Delete Music**

**Endpoint:** `DELETE /api/music/:id`

**Example:** `DELETE /api/music/6789abcd1234567890efgh12`

**Response:** (200 OK)

```json
{
  "success": true,
  "message": "Music deleted successfully",
  "data": {
    "_id": "6789abcd1234567890efgh12",
    "title": "Epic Rise"
  }
}
```

---

## 🔧 Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Please provide title, category, and audioUrl"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Music not found"
}
```

### 500 Server Error

```json
{
  "success": false,
  "message": "Server error while fetching music",
  "error": "Error details..."
}
```

---

## 🧪 Testing with cURL

### Add Music

```bash
curl -X POST http://localhost:5000/api/music \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Track",
    "category": "Pop",
    "duration": "0:30",
    "audioUrl": "https://example.com/audio/test.mp3",
    "tags": ["test", "pop"]
  }'
```

### Get All Music

```bash
curl http://localhost:5000/api/music
```

### Get by Category

```bash
curl http://localhost:5000/api/music/category/Cinematic
```

### Get Trending

```bash
curl http://localhost:5000/api/music/trending?limit=5
```

### Like Music

```bash
curl -X PATCH http://localhost:5000/api/music/YOUR_MUSIC_ID/like
```

### Delete Music

```bash
curl -X DELETE http://localhost:5000/api/music/YOUR_MUSIC_ID
```

---

## 📊 Database Schema

### Music Model

```javascript
{
  title: String (required, max 100 chars),
  category: String (required, indexed),
  duration: String (default: "0:30"),
  audioUrl: String (required),
  isPremium: Boolean (default: false),
  likes: Number (default: 0, min: 0),
  tags: Array of Strings,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## 🎯 Sample Categories

The API supports these categories (matching your frontend):

- Funny / Comedy
- Emotional / Sad
- Cinematic / Epic
- Trending / Viral
- Lofi / Lo-Fi
- Jazz
- Pop
- Hip-Hop
- Motivational
- And more...

---

## 🛠️ Available Scripts

```bash
# Start server (production)
npm start

# Start server with auto-reload (development)
npm run dev

# Seed sample data
npm run seed
```

---

## 🔐 Security Notes

- Currently, this is a **public API** (no authentication)
- For production, add authentication middleware
- Validate and sanitize all user inputs
- Use environment variables for sensitive data
- Enable rate limiting for production

---

## 🌐 Connecting Frontend

In your React Native app:

```javascript
const API_BASE_URL = "http://localhost:5000/api/music";

// Get music by category
const getMusicByCategory = async (category) => {
  const response = await fetch(`${API_BASE_URL}/category/${category}`);
  const data = await response.json();
  return data.data; // Array of music
};

// Like a track
const likeTrack = async (musicId) => {
  await fetch(`${API_BASE_URL}/${musicId}/like`, {
    method: "PATCH",
  });
};
```

---

## 📝 Notes

- MongoDB must be running before starting the server
- Default port is 5000 (configurable in .env)
- Use `npm run seed` to populate database with sample data
- All responses follow consistent JSON format: `{ success, message, data }`

---

## 🐛 Troubleshooting

**MongoDB Connection Failed?**

- Check if MongoDB is running: `mongod`
- Verify MONGODB_URI in .env file
- For Atlas, ensure IP is whitelisted

**Port Already in Use?**

- Change PORT in .env file
- Kill process using port 5000

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)

---

## 📄 License

ISC

---

**Built with ❤️ for short-video creators**
