import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  audioId: {
    type: String,
    required: true,
  },
  title: String,
  category: String,
  duration: Number,
  audioUrl: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Unique constraint on userId + audioId combination
favoriteSchema.index({ userId: 1, audioId: 1 }, { unique: true });

export default mongoose.model("Favorite", favoriteSchema);
