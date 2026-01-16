import express from "express";
import { uploadFields } from "../middlewares/upload.middleware.js";
import { 
  uploadAudio,
  getAllAudio,
  getAudioById,
  getAudioByCategory
} from "../controllers/audio.controller.js";

const router = express.Router();

// POST /api/audio/upload - Upload audio file with metadata
// Expected form-data: 
//   - audio (file) - the audio file
//   - title (text) - audio title
//   - category (text) - audio category
//   - duration (text) - audio duration in seconds
router.post("/upload", uploadFields, uploadAudio);

// GET /api/audio - Get all audio files
router.get("/", getAllAudio);

// GET /api/audio/:id - Get audio by ID
router.get("/:id", getAudioById);

// GET /api/audio/category/:category - Get audio by category
router.get("/category/:category", getAudioByCategory);

// Error handling for multer
router.use((err, req, res, next) => {
  if (err.code === "LIMIT_PART_COUNT") {
    res.status(400).json({ success: false, error: "Too many parts" });
  } else if (err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ success: false, error: "File too large" });
  } else if (err.code === "LIMIT_FILE_COUNT") {
    res.status(400).json({ success: false, error: "Too many files" });
  } else if (err.code === "LIMIT_FIELD_KEY") {
    res.status(400).json({ success: false, error: "Field name too long" });
  } else if (err.code === "LIMIT_FIELD_VALUE") {
    res.status(400).json({ success: false, error: "Field value too long" });
  } else if (err.code === "LIMIT_FIELD_COUNT") {
    res.status(400).json({ success: false, error: "Too many fields" });
  } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
    res.status(400).json({ success: false, error: "Unexpected file field" });
  } else if (err.message) {
    res.status(400).json({ success: false, error: err.message });
  } else {
    next();
  }
});

export default router;
