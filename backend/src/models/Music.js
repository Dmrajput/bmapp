import mongoose from "mongoose";

const musicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  duration: {
    type: String,
    default: "",
    trim: true,
  },
  audioUrl: {
    type: String,
    required: true,
    trim: true,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  likes: {
    type: Number,
    default: 0,
    min: 0,
  },
  tags: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Music = mongoose.model("Music", musicSchema);

export default Music;
