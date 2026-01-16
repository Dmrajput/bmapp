import multer from "multer";

const storage = multer.memoryStorage();

const uploadConfig = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Export fields-based upload to handle both file and text fields
export const uploadFields = uploadConfig.fields([
  { name: "audio", maxCount: 1 },
  { name: "title", maxCount: 1 },
  { name: "category", maxCount: 1 },
  { name: "duration", maxCount: 1 }
]);

export default uploadConfig;
