import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // Always load env first
import Prisma from "./db/db.js";
import app from "./app.js";
import { envConfig } from "./config/env.config.js";

(async function main() {
  try {
    console.log("Connecting to database...");
    await Prisma.$connect();
    console.log("✅ Database connected");

    const PORT = envConfig.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup error:", error);
    process.exit(1);
  }
})();
