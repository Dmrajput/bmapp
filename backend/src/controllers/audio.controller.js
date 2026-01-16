import s3 from "../config/s3.js";
import Audio from "../models/Audio.js";

// export const uploadAudio = async (req, res) => {
//   try {
//     // Check if file exists - with upload.fields(), files are in req.files
//     if (!req.files || !req.files.audio || !req.files.audio[0]) {
//       return res.status(400).json({
//         success: false,
//         error: "No audio file provided. Make sure to send the file with field name 'audio' in form-data."
//       });
//     }

//     // Get file from fields
//     const audioFile = req.files.audio[0];

//     // Get text fields - with upload.fields(), text fields are also in req.files
//     const title = req.files.title?.[0]?.value || "Untitled";
//     const category = req.files.category?.[0]?.value || "General";
//     const duration = req.files.duration?.[0]?.value || "0";

//     console.log("File info:", audioFile);
//     // console.log("Form data:", { title, category, duration });

//     // Create Audio document
//     const audio = await Audio.create({
//       title: title,
//       category: category,
//       duration: parseInt(duration) || 0,
//       audioUrl: audioFile.location || `s3://buffer-${Date.now()}`,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Audio uploaded successfully",
//       data: audio,
//     });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({
//       success: false,
//       error: err.message
//     });
//   }
// };

export const uploadAudio = async (req, res) => {
  try {
    // 1️⃣ Validate file
    if (!req.files?.audio?.[0]) {
      return res.status(400).json({
        success: false,
        error: "Audio file is required (field name: audio)",
      });
    }

    const file = req.files.audio[0];

    // 2️⃣ Text fields (IMPORTANT FIX)
    const title = req.body.title || "Untitled";
    const category = req.body.category || "General";
    const duration = parseInt(req.body.duration) || 0;

    // 3️⃣ Upload to S3
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `audio/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const uploadResult = await s3.upload(s3Params).promise();

    // 4️⃣ Save to MongoDB (REAL URL)
    const audio = await Audio.create({
      title,
      category,
      duration,
      audioUrl: uploadResult.Location, // ✅ HTTPS URL
    });

    return res.status(201).json({
      success: true,
      message: "Audio uploaded successfully",
      data: audio,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Get all audio files
export const getAllAudio = async (req, res) => {
  try {
    const audioList = await Audio.find({}).sort({ createdAt: -1 });

    if (audioList.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No audio files found",
        data: [],
      });
    }
    res.status(200).json({
      success: true,
      message: "Audio files fetched successfully",
      data: audioList,
    });
  } catch (err) {
    console.error("Get all audio error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Get audio by ID
export const getAudioById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid audio ID format",
      });
    }

    const audio = await Audio.findById(id);

    if (!audio) {
      return res.status(404).json({
        success: false,
        error: "Audio not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Audio fetched successfully",
      data: audio,
    });
  } catch (err) {
    console.error("Get audio by ID error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Get audio by category
export const getAudioByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const audioList = await Audio.find({ category }).sort({ createdAt: -1 });

    if (audioList.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No audio files found for category: ${category}`,
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Audio files fetched successfully",
      data: audioList,
    });
  } catch (err) {
    console.error("Get audio by category error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// exports.uploadAudio = async (req, res) => {
//   try {
//     const { title, category, duration } = req.body;

//     const params = {
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: `audio/${Date.now()}-${req.file.originalname}`,
//       Body: req.file.buffer,
//       ContentType: req.file.mimetype,
//     };

//     const uploadResult = await s3.upload(params).promise();

//     const audio = await Audio.create({
//       title,
//       category,
//       duration,
//       audioUrl: uploadResult.Location,
//     });

//     res.status(201).json(audio);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
