const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("../config/aws");

const s3 = new AWS.S3();

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, `audio/${Date.now()}-${file.originalname}`);
    },
  }),
});

module.exports = upload;
