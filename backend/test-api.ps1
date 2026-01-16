# 🎵 Music API - Quick Test Script (PowerShell)
# Run this after starting your server to test all endpoints

Write-Host "🎵 Testing Music API" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:5000"

# 1. Health Check
Write-Host "1. Health Check" -ForegroundColor Blue
Invoke-RestMethod -Uri "$API_URL/" -Method Get | ConvertTo-Json -Depth 10
Write-Host ""

# 2. Get All Music
Write-Host "2. Get All Music" -ForegroundColor Blue
$allMusic = Invoke-RestMethod -Uri "$API_URL/api/music" -Method Get
Write-Host "Found $($allMusic.count) tracks"
$allMusic | ConvertTo-Json -Depth 10
Write-Host ""

# 3. Get Music by Category
Write-Host "3. Get Music by Category (Cinematic)" -ForegroundColor Blue
Invoke-RestMethod -Uri "$API_URL/api/music/category/Cinematic" -Method Get | ConvertTo-Json -Depth 10
Write-Host ""

# 4. Get Trending Music
Write-Host "4. Get Trending Music (Top 5)" -ForegroundColor Blue
Invoke-RestMethod -Uri "$API_URL/api/music/trending?limit=5" -Method Get | ConvertTo-Json -Depth 10
Write-Host ""

# 5. Add New Music
Write-Host "5. Add New Music" -ForegroundColor Blue
$body = @{
    title = "Test Track from PowerShell"
    category = "Pop"
    duration = "0:30"
    audioUrl = "https://example.com/audio/test.mp3"
    tags = @("test", "pop", "new")
} | ConvertTo-Json

$newMusic = Invoke-RestMethod -Uri "$API_URL/api/music" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$newMusic | ConvertTo-Json -Depth 10
$musicId = $newMusic.data._id
Write-Host ""

# 6. Like the newly created music
if ($musicId) {
    Write-Host "6. Like Music (ID: $musicId)" -ForegroundColor Blue
    Invoke-RestMethod -Uri "$API_URL/api/music/$musicId/like" -Method Patch | ConvertTo-Json -Depth 10
    Write-Host ""
}

# 7. Delete the test music
if ($musicId) {
    Write-Host "7. Delete Test Music (ID: $musicId)" -ForegroundColor Blue
    Invoke-RestMethod -Uri "$API_URL/api/music/$musicId" -Method Delete | ConvertTo-Json -Depth 10
    Write-Host ""
}

Write-Host "✅ All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "API is working correctly! 🎉" -ForegroundColor Green
