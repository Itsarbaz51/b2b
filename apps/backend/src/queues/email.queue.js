// queues/email.queue.js
import { Queue } from "bullmq";
import "dotenv/config";
import { URL } from "url";

const redisUrl = new URL(process.env.REDIS_URL);

export const emailQueue = new Queue("emailQueue", {
  connection: {
    host: redisUrl.hostname,
    port: Number(redisUrl.port),
    username: redisUrl.username,
    password: redisUrl.password,
  },
});

console.log("REDIS CONFIG:", {
  host: redisUrl.hostname,
  port: redisUrl.port,
});
