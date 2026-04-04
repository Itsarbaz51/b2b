import "dotenv/config"; // ✅ ADD THIS
import { Worker } from "bullmq";
import { sendCredentialsEmail } from "../utils/sendCredentialsEmail.js";
import { URL } from "url";
import Prisma from "../db/db.js";

const redisUrl = new URL(process.env.REDIS_URL);

const worker = new Worker(
  "emailQueue",
  async (job) => {
    console.log("📩 Job received:", job.name);

    const {
      user,
      password,
      transactionPin,
      actionType,
      customMessage,
      userType,
    } = job.data;

    await sendCredentialsEmail(
      user,
      password,
      transactionPin,
      actionType,
      customMessage,
      userType
    );

    // await Prisma.user.update({
    //   where: { id: user.id },
    //   data: { emailSent: true },
    // });

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
