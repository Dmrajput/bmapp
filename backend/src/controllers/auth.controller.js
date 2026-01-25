import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const buildTokens = (userId) => {
  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new Error("JWT secrets are not configured");
  }

  const accessToken = jwt.sign({ userId }, accessSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

  const refreshToken = jwt.sign({ userId }, refreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

  return { accessToken, refreshToken };
};

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

    const { accessToken, refreshToken } = buildTokens(user._id.toString());
    await User.findByIdAndUpdate(user._id, { refreshToken });

    return res.status(201).json({
      success: true,
      message: "Account created",
      data: {
        user: { id: user._id, name: user.name, email: user.email },
        accessToken,
        refreshToken,
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
      return res.status(401).json({ success: false, error: "Invalid login" });
    }

    if (user.provider !== "email") {
      return res.status(400).json({
        success: false,
        error: "Use social login for this account",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid login" });
    }

    const { accessToken, refreshToken } = buildTokens(user._id.toString());
    await User.findByIdAndUpdate(user._id, { refreshToken });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: { id: user._id, name: user.name, email: user.email },
        accessToken,
        refreshToken,
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
    }

    const { accessToken, refreshToken } = buildTokens(user._id.toString());
    await User.findByIdAndUpdate(user._id, {
      refreshToken,
      provider: "google",
    });

    return res.status(200).json({
      success: true,
      message: "Google auth successful",
      data: {
        user: { id: user._id, name: user.name, email: user.email },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "refreshToken is required",
      });
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      throw new Error("JWT_REFRESH_SECRET is not configured");
    }

    const payload = jwt.verify(token, refreshSecret);
    const user = await User.findById(payload.userId).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        error: "Invalid refresh token",
      });
    }

    const accessSecret = process.env.JWT_SECRET;
    if (!accessSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const accessToken = jwt.sign({ userId: user._id }, accessSecret, {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: { accessToken },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(401).json({ success: false, error: error.message });
  }
};
