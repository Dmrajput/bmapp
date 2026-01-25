// import AWS from "aws-sdk";

// AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   secretAccessKey: process.env.AWS_SECRET_KEY,
//   region: process.env.AWS_REGION,
// });

// const s3 = new AWS.S3();
// export default s3;

import AWS from "aws-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const accessKeyId =
  process.env.AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey =
  process.env.AWS_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || "";
const region = process.env.AWS_REGION || "ap-south-1";

AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region,
});

const s3 = new AWS.S3();

export default s3;
