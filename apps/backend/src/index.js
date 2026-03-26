import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); 
import Prisma from "./db/db.js";
import app from "./app.js";
import { envConfig } from "./config/env.config.js";
import { startCronJobs } from "./cron/index.js";

(async function main() {
  try {
    console.log("Cron starting...");
    startCronJobs();
    console.log("Connecting to database...");
    await Prisma.$connect();
    console.log("✅ Database connected");

    const PORT = envConfig.PORT;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup error:", error);
    process.exit(1);
  }
})();
