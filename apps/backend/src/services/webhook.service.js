import axios from "axios";
import Prisma from "../db/db.js";

export default class WebhookService {
  static async trigger(event, payload) {
    const webhooks = await Prisma.webhook.findMany({
      where: { isActive: true, event },
    });

    for (const hook of webhooks) {
      try {
        await axios.post(hook.url, {
          event,
          data: payload,
        });

        await Prisma.webhookLog.create({
          data: {
            webhookId: hook.id,
            status: "SUCCESS",
          },
        });
      } catch (err) {
        await Prisma.webhookLog.create({
          data: {
            webhookId: hook.id,
            status: "FAILED",
            error: err.message,
          },
        });
      }
    }
  }
}
