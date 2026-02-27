import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs, { createReadStream } from "fs";
import path from "path";
import mime from "mime-types";
import { s3Env } from "../config/env.config.js";

const s3 = new S3Client({
  region: s3Env.region,
  credentials: {
    accessKeyId: s3Env.accessKeyId,
    secretAccessKey: s3Env.secretAccessKey,
  },
});

// Main folder prefix
const MAIN_FOLDER = "fintech";

// Define allowed subfolders

class S3Service {
  constructor() {
    this.bucket = s3Env.bucketName;
  }

  async upload(localFilePath, category) {
    try {
      if (!localFilePath) {
        console.error("No file path provided.");
        return null;
      }

      const fileStream = createReadStream(localFilePath);
      const fileName = path.basename(localFilePath);
      const mimeType = mime.lookup(localFilePath) || "application/octet-stream";

      const uniqueFileName = `${Date.now()}_${fileName}`;
      const s3Key = `${MAIN_FOLDER}/${category}/${uniqueFileName}`;

      const uploadParams = {
        Bucket: this.bucket,
        Key: s3Key,
        Body: fileStream,
        ContentType: mimeType,
      };

      const command = new PutObjectCommand(uploadParams);
      await s3.send(command);

      fs.unlinkSync(localFilePath);

      const fileUrl = `https://${this.bucket}.s3.${s3Env.region}.amazonaws.com/${s3Key}`;
      return fileUrl;
    } catch (error) {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      console.error("S3 upload error:", error);
      return null;
    }
  }

  async delete(findePost) {
    try {
      const fileUrl = findePost?.fileUrl;
      if (!fileUrl) {
        console.error("No file URL found.");
        return false;
      }

      const key = fileUrl.split(`.amazonaws.com/`)[1];
      if (!key) {
        console.error("Failed to extract key from file URL.");
        return false;
      }

      const deleteParams = {
        Bucket: this.bucket,
        Key: key,
      };

      const command = new DeleteObjectCommand(deleteParams);
      await s3.send(command);

      return true;
    } catch (error) {
      console.error("S3 delete error:", error);
      return false;
    }
  }
}

export default new S3Service();
