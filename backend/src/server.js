import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (!process.env.AWS_ACCESS_KEY && !process.env.AWS_ACCESS_KEY_ID) {
      console.warn("⚠️ AWS access key is missing from env");
    }
    if (!process.env.AWS_SECRET_KEY && !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn("⚠️ AWS secret key is missing from env");
    }
    if (!process.env.AWS_REGION) {
      console.warn("⚠️ AWS region is missing from env");
    }
    if (!process.env.AWS_BUCKET_NAME) {
      console.warn("⚠️ AWS bucket name is missing from env");
    }

    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🎵 Audio endpoint: http://localhost:${PORT}/api/audio`);
    });

    // Handle unhandled rejections
    process.on("unhandledRejection", (err) => {
      console.error("❌ Unhandled Rejection:", err);
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      console.error("❌ Uncaught Exception:", err);
    });

    // Keep process alive
    process.on("SIGTERM", () => {
      console.log("👋 SIGTERM received, shutting down gracefully");
      server.close(() => {
        console.log("💤 Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
};

startServer();
