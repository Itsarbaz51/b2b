export default class WebhookEngine {
  // 1️⃣ Store Raw Webhook
  static async store(
    tx,
    {
      transactionId,
      apiEntityId,
      provider,
      eventType,
      payload,
      headers,
      signature,
    }
  ) {
    return await tx.apiWebhook.create({
      data: {
        transactionId,
        apiEntityId,
        provider,
        eventType,
        payload,
        headers,
        signature,
        status: "PENDING",
      },
    });
  }

  // 2️⃣ Mark Processed
  static async markProcessed(tx, webhookId, responseData) {
    return await tx.apiWebhook.update({
      where: { id: webhookId },
      data: {
        status: "PROCESSED",
        response: responseData,
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });
  }

  // 3️⃣ Mark Failed
  static async markFailed(tx, webhookId, errorData) {
    return await tx.apiWebhook.update({
      where: { id: webhookId },
      data: {
        status: "FAILED",
        response: errorData,
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });
  }
}
