import Prisma from "../db/db.js";
import PayoutService from "../services/payout/payout.service.js";

export async function checkPendingTransactions() {
  const pending = await Prisma.transaction.findMany({
    where: {
      status: "PENDING",
      initiatedAt: {
        lt: new Date(Date.now() - 5 * 60 * 1000),
      },
    },
  });

  for (const txn of pending) {
    try {
      console.log("Auto checking:", txn.id);

      await PayoutService.checkStatus(
        {
          serviceId: txn.serviceId,
          provider: txn.provider,
          clientOrderId: txn.providerReference,
        },
        { id: txn.userId }
      );
    } catch (err) {
      console.log("Status check failed:", err.message);
    }
  }
}
