import Prisma from "../db/db.js";
import FundRequestService from "../services/fundRequest/fundRequest.service.js";
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
    include: {
      serviceProviderMapping: {
        include: {
          service: true,
        },
      },
    },
  });

  for (const txn of pending) {
    try {
      console.log("Auto checking:", txn.id);

      // IMPORTANT: type based routing
      if (txn.serviceProviderMapping.service.code == "PAYOUT") {
        await PayoutService.checkStatus(
          {
            serviceProviderMappingId: txn.serviceProviderMappingId,
            txnId: txn.txnId,
          },
          { id: txn.userId },
          true
        );
      } else if (txn.serviceProviderMapping.service.code === "FUND_REQUEST") {
        await FundRequestService.checkStatus(
          {
            serviceProviderMappingId: txn.serviceProviderMappingId,
            txnId: txn.txnId,
          },
          { id: txn.userId },
          true
        );
      } else {
        console.log(
          "Unknown txn type:",
          txn.serviceProviderMapping.service.code
        );
        continue;
      }

      // update after correct service call
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
