import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "APP_SESSION";

/**
 * Shape:
 * {
 *   isLoggedIn: boolean;
 *   user: { id, name, email } | null;
 *   loggedInAt: string; // ISO timestamp
 * }
 */

async function saveSession(user) {
  try {
    if (!user || !user.id) {
      // Do not persist invalid user objects
      return { ok: false, message: "Invalid user data" };
    }

    const payload = {
      isLoggedIn: true,
      user,
      loggedInAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    return { ok: true };
  } catch (error) {
    console.log("❌ Failed to save session:", error);
    return { ok: false, message: "Unable to save session" };
  }
}

async function getSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return parsed;
  } catch (error) {
    console.log("❌ Failed to read session:", error);
    return null;
  }
}

async function clearSession() {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    return { ok: true };
  } catch (error) {
    console.log("❌ Failed to clear session:", error);
    return { ok: false, message: "Unable to clear session" };
  }
}

async function isLoggedIn() {
  try {
    const session = await getSession();
    return !!(session && session.isLoggedIn && session.user);
  } catch {
    // getSession() already logs and handles its own errors
    return false;
  }
}

const SessionManager = {
  saveSession,
  getSession,
  clearSession,
  isLoggedIn,
};

export default SessionManager;


