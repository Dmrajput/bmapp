import express from "express";
import {
  createMusic,
  getAllMusic,
  getMusicByCategory,
  getTrendingMusic,
  likeMusic,
  deleteMusic,
} from "../controllers/music.controller.js";

const router = express.Router();

// POST /api/music -> Add new music
router.post("/", createMusic);

// GET /api/music -> Get all music
router.get("/", getAllMusic);

// GET /api/music/category/:category -> Get music by category
router.get("/category/:category", getMusicByCategory);

// GET /api/music/trending -> Trending music sorted by likes desc
router.get("/trending", getTrendingMusic);

// PATCH /api/music/:id/like -> Increment likes
router.patch("/:id/like", likeMusic);

// DELETE /api/music/:id -> Delete music
router.delete("/:id", deleteMusic);

export default router;
