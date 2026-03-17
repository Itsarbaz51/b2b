export default class WebhookService {
  // STORE
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
        attempts: 0,
      },
    });
  }

  // SUCCESS
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

  // FAILED
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
