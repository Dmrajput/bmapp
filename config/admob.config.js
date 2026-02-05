import Constants from "expo-constants";
import { TestIds } from "react-native-google-mobile-ads";

const admobMode = (
  Constants.expoConfig?.extra?.ADMOB_MODE ||
  Constants.manifest?.extra?.ADMOB_MODE ||
  "TEST"
).toUpperCase();

const IS_TEST_ADS = admobMode !== "PROD";
const AD_UNIT_IDS = IS_TEST_ADS
  ? {
      BANNER: TestIds.BANNER,
      INTERSTITIAL: TestIds.INTERSTITIAL,
    }
  : {
      BANNER: "ca-app-pub-2136043836079463/6534214524",
      INTERSTITIAL: "ca-app-pub-2136043836079463/1855112220",
    };

// Switch to production by setting ADMOB_MODE=PROD in app.config.js or build env.
export { AD_UNIT_IDS, IS_TEST_ADS };

