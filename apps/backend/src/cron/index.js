import cron from "node-cron";
import { checkPendingTransactions } from "./checkPending.js";

export function startCronJobs() {
  // every 1 hour
  cron.schedule("* * * * *", async () => {
    console.log("⏳ Running payout cron...");
    await checkPendingTransactions();
  });
}
