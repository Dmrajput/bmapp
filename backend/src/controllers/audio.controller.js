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
    const audioFile = req.files?.audio?.[0];
    const licenseFile = req.files?.license_txt?.[0];

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: "Audio file is required (field name: audio)",
      });
    }

    if (!licenseFile) {
      return res.status(400).json({
        success: false,
        error: "License text file is required (field name: license_txt)",
      });
    }

    const title = req.body.title || "Untitled";
    const category = req.body.category || "General";
    const duration = parseInt(req.body.duration, 10) || 0;

    const audioUpload = await s3
      .upload({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `audio/${Date.now()}-${audioFile.originalname}`,
        Body: audioFile.buffer,
        ContentType: audioFile.mimetype,
      })
      .promise();

    const licenseUpload = await s3
      .upload({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `licenses/${Date.now()}-${licenseFile.originalname}`,
        Body: licenseFile.buffer,
        ContentType: licenseFile.mimetype || "text/plain",
      })
      .promise();

    const audio = await Audio.create({
      title,
      category,
      duration,
      audioUrl: audioUpload.Location,
      source: "ai_generated",
      license_type: "Envato MusicGen – Commercial License",
      license_url: licenseUpload.Location,
      original_audio_url: req.body.original_audio_url,
      artist_name: req.body.artist_name || "Envato MusicGen AI",
      attribution_required: false,
      is_redistribution_allowed: false,
      usage_notes:
        "Licensed via Envato MusicGen. Allowed for commercial use inside this app as part of an end product. Redistribution outside the app is not permitted.",
    });

    return res.status(201).json({
      success: true,
      message: "Audio uploaded successfully",
      audio,
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

    const escapeRegExp = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchValue = String(category || "").trim();
    const normalized = searchValue
      .replace(/[\/_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const tokens = normalized.split(" ").filter(Boolean).map(escapeRegExp);
    const pattern = tokens.length
      ? tokens.join(".*")
      : escapeRegExp(searchValue);

    const audioList = await Audio.find({
      category: {
        $regex: pattern,
        $options: "i",
      },
    }).sort({ createdAt: -1 });

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
