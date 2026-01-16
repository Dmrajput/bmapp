import mongoose from "mongoose";

const audioSchema = new mongoose.Schema({
  title: String,
  category: String,
  duration: Number,
  audioUrl: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Audio", audioSchema);
