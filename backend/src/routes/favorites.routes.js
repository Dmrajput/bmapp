import express from "express";
import {
    addFavorite,
    getFavorites,
    removeFavorite,
} from "../controllers/favorites.controller.js";

const router = express.Router();

// GET /api/favorites -> Fetch favorites
router.get("/", getFavorites);

// POST /api/favorites -> Add favorite
router.post("/", addFavorite);

// DELETE /api/favorites/:audioId -> Remove favorite
router.delete("/:audioId", removeFavorite);

export default router;
