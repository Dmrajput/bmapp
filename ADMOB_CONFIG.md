# AdMob Configuration Guide

## 📱 Setup Instructions

### 1. Get Your AdMob Unit IDs

1. Go to [Google AdMob Console](https://apps.admob.com/)
2. Create an app (if not already created)
3. Create ad units:
   - **Banner Ad**: For top and inline ads
   - **Interstitial Ad**: Full-screen ads (shown every 5 plays)
   - **Rewarded Ad**: Optional - for reward-based ads

### 2. Update Ad Unit IDs

Replace the placeholder IDs in `src/screens/MusicListScreen.js`:

```javascript
const AD_UNIT_IDS = {
  BANNER: "ca-app-pub-XXXXXXXX/YYYYYYYY", // Your banner ad unit ID
  INTERSTITIAL: "ca-app-pub-XXXXXXXX/ZZZZZZZZ", // Your interstitial ad unit ID
  REWARDED: "ca-app-pub-XXXXXXXX/WWWWWWWW", // Your rewarded ad unit ID (optional)
};
```

### 3. Update app.json

Update your AdMob App IDs in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-XXXXXXXX~YYYYYYYY",
          "iosAppId": "ca-app-pub-XXXXXXXX~ZZZZZZZZ"
        }
      ]
    ]
  }
}
```

### 4. Test Ads (Development)

In development mode, the app automatically uses Google's test ad unit IDs. No changes needed.

### 5. Production Build

After updating the IDs:

1. Rebuild your app: `npx expo prebuild --clean`
2. Build for production: `eas build --platform android` or `eas build --platform ios`

## 🎯 Ad Placement Strategy

### Current Implementation:

1. **Top Banner Ad**: Always visible at the top of the music list
2. **Inline Banner Ads**: Shown every 5 items in the list
3. **Interstitial Ads**: Shown every 5 track plays

### Ad Frequency:

- **Banner Ads**: Non-intrusive, always visible
- **Interstitial Ads**: Every 5 plays (configurable in code)
- **Ad Labeling**: All ads are clearly labeled as "Advertisement"

## ⚙️ Configuration Options

### Adjust Interstitial Ad Frequency

In `MusicListScreen.js`, modify:

```javascript
// Show ad every N plays
if (playCountRef.current % 5 === 0) {
  // Change 5 to your desired frequency
  interstitialAdRef.current.show();
}
```

### Disable Ads for Premium Users

Add a check in the ad rendering:

```javascript
const isPremium = usePremium(); // Your premium check

{BannerAd && BannerAdSize && !isPremium && (
  // Ad component
)}
```

## 📊 Ad Performance Tips

1. **Request Non-Personalized Ads**: Already configured for GDPR compliance
2. **Ad Loading**: Ads load asynchronously, won't block UI
3. **Error Handling**: Failed ads won't crash the app
4. **User Experience**: Ads are clearly labeled and non-intrusive

## 🐛 Troubleshooting

### Ads Not Showing?

1. **Check Ad Unit IDs**: Ensure they're correct and active in AdMob
2. **Check App ID**: Verify app.json has correct AdMob App IDs
3. **Development Mode**: Test ads work automatically in dev mode
4. **Build Type**: Ads only work in development builds or production, not in Expo Go

### Common Errors:

- **"AdMob not available"**: Normal in Expo Go, requires dev build
- **"Ad failed to load"**: Check network connection and AdMob account status
- **"Invalid ad unit ID"**: Verify the ad unit ID in AdMob console

## 📝 Notes

- Ads are disabled in Expo Go (for testing)
- Test ads are automatically used in development mode
- Production ads require valid AdMob account and unit IDs
- All ads respect user privacy (non-personalized ads)
