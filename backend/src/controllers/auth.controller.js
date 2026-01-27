import bcrypt from "bcryptjs";
import User from "../models/User.js";

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").toLowerCase());

const isStrongPassword = (password) => String(password || "").length >= 8;

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "name, email, and password are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: "Invalid email" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Email already registered",
      });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      provider: "email",
    });

    return res.status(201).json({
      success: true,
      message: "Account created",
      data: {
        user: { id: user._id, name: user.name, email: user.email },
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    if (user.provider !== "email") {
      return res.status(400).json({
        success: false,
        error: "Use social login for this account",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: { id: user._id, name: user.name, email: user.email },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: "email and name are required",
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        provider: "google",
      });
    } else if (user.provider !== "google") {
      // Keep messaging user-friendly and consistent
      return res.status(400).json({
        success: false,
        error: "This account is registered with email/password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Google auth successful",
      data: {
        user: { id: user._id, name: user.name, email: user.email },
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
