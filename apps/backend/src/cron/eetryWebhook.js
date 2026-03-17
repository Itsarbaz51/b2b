import Prisma from "../db/db.js";
import WebhookController from "../controllers/webhook.controller.js";

export async function retryFailedWebhooks() {
  const failed = await Prisma.apiWebhook.findMany({
    where: {
      status: "FAILED",
      attempts: { lt: 5 },
    },
  });

  for (const webhook of failed) {
    try {
      console.log("Retry webhook:", webhook.id);

      await WebhookController.handle({
        body: webhook.payload,
        headers: webhook.headers,
        params: { provider: webhook.provider },
      });
    } catch (err) {
      console.log("Retry failed:", err.message);
    }
  }
}
