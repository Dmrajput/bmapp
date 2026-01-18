import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  audioId: {
    type: String,
    required: true,
    unique: true,
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

export default mongoose.model("Favorite", favoriteSchema);
