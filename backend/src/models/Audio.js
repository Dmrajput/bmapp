import mongoose from "mongoose";

const audioSchema = new mongoose.Schema(
  {
    title: String,
    category: String,
    duration: Number,
    audioUrl: String,

    /* -------- NEW OPTIONAL FIELDS -------- */

    type: {
      type: String,
      enum: ["music", "sound", "background music", "fx"],
      default: "music",
    },

    priority: {
      type: Number,
      default: 0, // higher = show first
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    download_count: {
      type: Number,
      default: 0,
    },

    /* -------- LICENSE & META -------- */

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
  },
  {
    timestamps: true,
  },
);

/* -------- INDEXES (IMPORTANT) -------- */
audioSchema.index({ category: 1 });
audioSchema.index({ type: 1 });
audioSchema.index({ priority: -1 });
audioSchema.index({ rating: -1 });
audioSchema.index({ download_count: -1 });

export default mongoose.model("Audio", audioSchema);
