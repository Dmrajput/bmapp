import express from "express";
import rateLimit from "express-rate-limit";
import {
    googleAuth,
    login,
    refreshToken,
    register,
} from "../controllers/auth.controller.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authLimiter);

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/google
router.post("/google", googleAuth);

// POST /api/auth/refresh
router.post("/refresh", refreshToken);

export default router;
