import Favorite from "../models/Favorite.js";

export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "Favorites fetched successfully",
      data: favorites,
    });
  } catch (error) {
    console.error("Get favorites error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const { audioId, title, category, duration, audioUrl } = req.body;

    if (!audioId) {
      return res.status(400).json({
        success: false,
        error: "audioId is required",
      });
    }

    const favorite = await Favorite.findOneAndUpdate(
      { audioId },
      { audioId, title, category, duration, audioUrl },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      success: true,
      message: "Favorite saved",
      data: favorite,
    });
  } catch (error) {
    console.error("Add favorite error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const { audioId } = req.params;
    if (!audioId) {
      return res.status(400).json({
        success: false,
        error: "audioId is required",
      });
    }

    await Favorite.findOneAndDelete({ audioId });

    return res.status(200).json({
      success: true,
      message: "Favorite removed",
    });
  } catch (error) {
    console.error("Remove favorite error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
