import "dotenv/config";
import { Worker } from "bullmq";
import {
  sendCredentialsEmail,
  sendPasswordResetEmail,
} from "../utils/sendCredentialsEmail.js";
import { URL } from "url";
import Prisma from "../db/db.js";

const redisUrl = new URL(process.env.REDIS_URL);
console.log("🚀 Worker started...");
console.log("SMTP CONFIG:", {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
});
const worker = new Worker(
  "emailQueue",
  async (job) => {
    console.log("📩 Job received:", job.name);

    if (job.name === "sendCredentials") {
      const {
        user,
        password,
        transactionPin,
        actionType,
        customMessage,
        userType,
        additionalData,
      } = job.data;

      if (!user?.email) throw new Error("User email missing");

      await sendCredentialsEmail(
        user,
        password,
        transactionPin,
        actionType,
        customMessage,
        userType,
        additionalData
      );
    }

    if (job.name === "sendPasswordReset") {
      const { user, resetUrl, userType, customMessage } = job.data;

      if (!user?.email) throw new Error("User email missing");
      await sendPasswordResetEmail(user, resetUrl, userType, customMessage);
    }

    console.log("✅ Email sent to:", user.email);
  },
  {
    connection: {
      host: redisUrl.hostname,
      port: Number(redisUrl.port),
      username: redisUrl.username,
      password: redisUrl.password,
    },
  }
);

worker.on("completed", (job) => {
  console.log(`🎉 Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job failed: ${job.id}`, err.message);
});
