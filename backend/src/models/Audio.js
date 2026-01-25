import mongoose from "mongoose";

const audioSchema = new mongoose.Schema({
  title: String,
  category: String,
  duration: Number,
  audioUrl: String,
  source: {
    type: String,
    default: "ai_generated",
  },
  license_type: {
    type: String,
    default: "Envato MusicGen – Commercial License",
  },
  license_url: String,
  original_audio_url: String,
  artist_name: {
    type: String,
    default: "Envato MusicGen AI",
  },
  attribution_required: {
    type: Boolean,
    default: false,
  },
  is_redistribution_allowed: {
    type: Boolean,
    default: false,
  },
  usage_notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Audio", audioSchema);
