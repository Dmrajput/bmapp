import mongoose from "mongoose";
import Music from "../models/Music.js";

const respond = (res, status, success, message, data = null) => {
  return res.status(status).json({ success, message, data });
};

export const createMusic = async (req, res) => {
  try {
    const { title, category, duration = "", audioUrl, isPremium = false, tags = [] } = req.body;

    if (!title || !category || !audioUrl) {
      return respond(res, 400, false, "title, category, and audioUrl are required.");
    }

    const music = await Music.create({
      title,
      category,
      duration,
      audioUrl,
      isPremium,
      tags,
    });

    return respond(res, 201, true, "Music created successfully.", music);
  } catch (error) {
    console.error("Create music error:", error);
    return respond(res, 500, false, "Failed to create music.");
  }
};

export const getAllMusic = async (_req, res) => {
  try {
    const musicList = await Music.find({}).sort({ createdAt: -1 });
    const message = musicList.length ? "Music fetched successfully." : "No music found.";
    return respond(res, 200, true, message, musicList);
  } catch (error) {
    console.error("Get all music error:", error);
    return respond(res, 500, false, "Failed to fetch music.");
  }
};

export const getMusicByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const musicList = await Music.find({ category }).sort({ createdAt: -1 });
    const message = musicList.length
      ? "Music fetched successfully."
      : `No music found for category: ${category}.`;
    return respond(res, 200, true, message, musicList);
  } catch (error) {
    console.error("Get music by category error:", error);
    return respond(res, 500, false, "Failed to fetch music by category.");
  }
};

export const getTrendingMusic = async (_req, res) => {
  try {
    const musicList = await Music.find({}).sort({ likes: -1, createdAt: -1 });
    const message = musicList.length ? "Trending music fetched successfully." : "No music found.";
    return respond(res, 200, true, message, musicList);
  } catch (error) {
    console.error("Get trending music error:", error);
    return respond(res, 500, false, "Failed to fetch trending music.");
  }
};

export const likeMusic = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return respond(res, 400, false, "Invalid music ID.");
    }

    const music = await Music.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!music) {
      return respond(res, 404, false, "Music not found.");
    }

    return respond(res, 200, true, "Like incremented successfully.", music);
  } catch (error) {
    console.error("Like music error:", error);
    return respond(res, 500, false, "Failed to like music.");
  }
};

export const deleteMusic = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return respond(res, 400, false, "Invalid music ID.");
    }

    const music = await Music.findByIdAndDelete(id);

    if (!music) {
      return respond(res, 404, false, "Music not found.");
    }

    return respond(res, 200, true, "Music deleted successfully.", music);
  } catch (error) {
    console.error("Delete music error:", error);
    return respond(res, 500, false, "Failed to delete music.");
  }
};
