#!/bin/bash

# 🎵 Music API - Quick Test Script
# Run this after starting your server to test all endpoints

echo "🎵 Testing Music API"
echo "===================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:5000"

echo -e "${BLUE}1. Health Check${NC}"
curl -s $API_URL/ | json_pp
echo ""
echo ""

echo -e "${BLUE}2. Get All Music${NC}"
curl -s $API_URL/api/music | json_pp
echo ""
echo ""

echo -e "${BLUE}3. Get Music by Category (Cinematic)${NC}"
curl -s $API_URL/api/music/category/Cinematic | json_pp
echo ""
echo ""

echo -e "${BLUE}4. Get Trending Music (Top 5)${NC}"
curl -s $API_URL/api/music/trending?limit=5 | json_pp
echo ""
echo ""

echo -e "${BLUE}5. Add New Music${NC}"
curl -s -X POST $API_URL/api/music \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Track",
    "category": "Pop",
    "duration": "0:30",
    "audioUrl": "https://example.com/audio/test.mp3",
    "tags": ["test", "pop", "new"]
  }' | json_pp
echo ""
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "To test Like and Delete, copy a music ID from above responses"
echo "Then run:"
echo "  curl -X PATCH $API_URL/api/music/{MUSIC_ID}/like"
echo "  curl -X DELETE $API_URL/api/music/{MUSIC_ID}"
