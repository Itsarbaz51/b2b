import cron from "node-cron";
import { retryFailedWebhooks } from "./eetryWebhook.js";
import { checkPendingTransactions } from "./checkPending.js";

export function startCronJobs() {
  // 🔁 Retry failed webhook (every 2 min)
  cron.schedule("*/2 * * * *", async () => {
    console.log("Running webhook retry...");
    await retryFailedWebhooks();
  });

  // ⏳ Pending status check (every 5 min)
  cron.schedule("*/5 * * * *", async () => {
    console.log("Checking pending transactions...");
    await checkPendingTransactions();
  });
}
