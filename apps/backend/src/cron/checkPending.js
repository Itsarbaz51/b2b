import Prisma from "../db/db.js";
import PayoutService from "../services/payout/payout.service.js";

export async function checkPendingTransactions() {
  const pending = await Prisma.transaction.findMany({
    where: {
      status: "PENDING",
      initiatedAt: {
        lt: new Date(Date.now() - 10 * 60 * 1000),
      },
      retryCount: {
        lt: 10,
      },
    },
  });

  for (const txn of pending) {
    try {
      console.log("Auto checking:", txn.id);
      PayoutService.checkStatus(
        {
          serviceProviderMappingId: txn.serviceProviderMappingId,
          txnId: txn.txnId,
        },
        { id: txn.userId },
        true
      );
      await Prisma.transaction.update({
        where: { id: txn.id },
        data: {
          retryCount: { increment: 1 },
          lastCheckedAt: new Date(),
        },
      });
    } catch (err) {
      console.log("Status check failed:", err.message);
    }
  }
}
