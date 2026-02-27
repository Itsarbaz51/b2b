import { ApiError } from "../utils/ApiError.js";
import Prisma from "../db/db.js";

const ROLE_HIERARCHY = {
  ADMIN: 0,
  "STATE HEAD": 1,
  "MASTER DISTRIBUTOR": 2,
  DISTRIBUTOR: 3,
  RETAILER: 4,
};

export class CommissionDistributionService {
  static async getCommissionChain(userId, serviceId, channel = null) {
    const userWithPath = await Prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        parentId: true,
        roleId: true,
        role: {
          select: {
            name: true,
          },
        },
        hierarchyPath: true,
        hierarchyLevel: true,
      },
    });

    if (!userWithPath) throw ApiError.notFound("User not found");

    const hierarchyIds = userWithPath.hierarchyPath.split("/").filter(Boolean);
    if (hierarchyIds.length === 0) {
      hierarchyIds.push(userId);
    }

    const chainUsers = await Prisma.user.findMany({
      where: {
        id: { in: hierarchyIds },
      },
      select: {
        id: true,
        parentId: true,
        roleId: true,
        role: {
          select: {
            name: true,
          },
        },
        hierarchyLevel: true,
        hierarchyPath: true,
      },
      orderBy: { hierarchyLevel: "asc" },
    });

    if (chainUsers.length !== hierarchyIds.length) {
      throw ApiError.internal("Incomplete hierarchy chain");
    }

    this.validateHierarchyOrder(chainUsers);

    return await this.resolveCommissionSettings(chainUsers, serviceId, channel);
  }

  static validateHierarchyOrder(chainUsers) {
    const roleLevels = chainUsers.map((user) => {
      const roleName =
        user.role?.name?.toUpperCase().replace(/\s+/g, "_") || "";
      return ROLE_HIERARCHY[roleName] ?? 999;
    });

    for (let i = 1; i < roleLevels.length; i++) {
      if (roleLevels[i] <= roleLevels[i - 1]) {
        throw ApiError.internal("Invalid hierarchy order detected");
      }
    }
  }

  static async resolveCommissionSettings(chainUsers, serviceId, channel) {
    const results = [];
    const roleCommissionCache = new Map();
    const now = new Date();

    const userIds = chainUsers.map((u) => u.id);
    const userSettings = await Prisma.commissionSetting.findMany({
      where: {
        scope: "USER",
        targetUserId: { in: userIds },
        serviceId,
        isActive: true,
        // channel field removed as per schema
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      orderBy: { effectiveFrom: "desc" },
    });

    const userSettingsMap = new Map(
      userSettings.map((setting) => [setting.targetUserId, setting])
    );

    for (const user of chainUsers) {
      const roleName = user.role?.name || "UNKNOWN";

      const userSetting = userSettingsMap.get(user.id);
      if (userSetting) {
        results.push({
          userId: user.id,
          roleId: user.roleId,
          roleName: roleName,
          commissionType: userSetting.commissionType,
          commissionValue: userSetting.commissionValue,
          level: user.hierarchyLevel,
        });
        continue;
      }

      if (user.roleId) {
        let roleSetting = roleCommissionCache.get(user.roleId);

        if (roleSetting === undefined) {
          roleSetting = await Prisma.commissionSetting.findFirst({
            where: {
              scope: "ROLE",
              roleId: user.roleId,
              serviceId,
              isActive: true,
              // channel field removed as per schema
              effectiveFrom: { lte: now },
              OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
            },
            orderBy: { effectiveFrom: "desc" },
          });

          roleCommissionCache.set(user.roleId, roleSetting);
        }

        if (roleSetting) {
          results.push({
            userId: user.id,
            roleId: user.roleId,
            roleName: roleName,
            commissionType: roleSetting.commissionType,
            commissionValue: roleSetting.commissionValue,
            level: user.hierarchyLevel,
          });
          continue;
        }
      }

      results.push({
        userId: user.id,
        roleId: user.roleId,
        roleName: roleName,
        commissionType: "FLAT",
        commissionValue: 0,
        level: user.hierarchyLevel,
      });
    }

    this.validateCommissionChain(results);

    return results;
  }

  static calculateCommissionAmount(
    baseAmount,
    commissionType,
    commissionValue
  ) {
    if (commissionType === CommissionType.FLAT) {
      const decimalValue = Number(commissionValue);
      const amountInPaise = Math.round(decimalValue * 100);
      return BigInt(amountInPaise);
    } else {
      const decimalValue = Number(commissionValue);
      const percentage = decimalValue / 100;
      const commission = Number(baseAmount) * percentage;
      return BigInt(Math.round(commission));
    }
  }

  static validateCommissionChain(chain) {
    if (chain.length === 0) return;

    const userIds = new Set();
    for (const member of chain) {
      if (userIds.has(member.userId)) {
        throw ApiError.internal(
          `Duplicate user ${member.userId} in commission chain`
        );
      }
      userIds.add(member.userId);
    }

    for (const member of chain) {
      const value = Number(member.commissionValue);

      if (member.commissionType === CommissionType.PERCENTAGE) {
        if (value < 0 || value > 100) {
          throw ApiError.internal(
            `Invalid percentage ${value} for user ${member.userId}`
          );
        }
      } else {
        if (value < 0) {
          throw ApiError.internal(
            `Negative flat commission ${value} for user ${member.userId}`
          );
        }
      }
    }
  }

  static calculateHierarchicalCommissions(chain, baseAmount) {
    const commissions = [];

    if (chain.length === 0) return commissions;

    const sortedChain = [...chain].sort((a, b) => a.level - b.level);

    const adminMember = sortedChain.find((member) => member.level === 0);

    if (!adminMember) {
      console.log("No ADMIN found in commission chain");
      const firstMember = sortedChain[0];
      if (firstMember) {
        const totalCommissionPool = this.calculateCommissionAmount(
          baseAmount,
          firstMember.commissionType,
          firstMember.commissionValue
        );

        return this.distributeCommissionPool(sortedChain, totalCommissionPool);
      }
      return commissions;
    }

    const totalCommissionPool = this.calculateCommissionAmount(
      baseAmount,
      adminMember.commissionType,
      adminMember.commissionValue
    );

    console.log("Total commission pool calculated by ADMIN", {
      adminUserId: adminMember.userId,
      totalCommissionPool: Number(totalCommissionPool) / 100,
      baseAmount: Number(baseAmount) / 100,
      commissionType: adminMember.commissionType,
      commissionValue: adminMember.commissionValue,
    });

    return this.distributeCommissionPool(sortedChain, totalCommissionPool);
  }

  static distributeCommissionPool(chain, totalCommissionPool) {
    const commissions = [];
    let remainingPool = totalCommissionPool;

    for (let i = 0; i < chain.length; i++) {
      const member = chain[i];
      if (!member) continue;

      let memberCommission;

      if (i === chain.length - 1) {
        memberCommission = remainingPool;
      } else {
        memberCommission = this.calculateCommissionAmount(
          remainingPool,
          member.commissionType,
          member.commissionValue
        );

        if (memberCommission > remainingPool) {
          memberCommission = remainingPool;
        }
      }

      commissions.push({
        userId: member.userId,
        roleName: member.roleName,
        amount: memberCommission,
        level: member.level,
        commissionType: member.commissionType,
        commissionValue: member.commissionValue,
      });

      remainingPool -= memberCommission;

      console.log("Member commission allocated", {
        userId: member.userId,
        role: member.roleName,
        level: member.level,
        commission: Number(memberCommission) / 100,
        remainingPool: Number(remainingPool) / 100,
      });

      if (remainingPool <= 0) break;
    }

    const totalDistributed = commissions.reduce(
      (sum, c) => sum + c.amount,
      BigInt(0)
    );

    if (totalDistributed !== totalCommissionPool) {
      if (Math.abs(Number(totalCommissionPool - totalDistributed)) <= 1) {
        console.log("Minor rounding difference auto-corrected");
        if (commissions.length > 0) {
          const lastCommission = commissions[commissions.length - 1];
          if (lastCommission) {
            lastCommission.amount += totalCommissionPool - totalDistributed;
          }
        }
      } else {
        throw ApiError.internal(
          `Commission distribution mismatch: Pool ${totalCommissionPool} vs Distributed ${totalDistributed}`
        );
      }
    }

    return commissions;
  }

  static calculateCommissionPayouts(commissions, transactionId) {
    const payouts = [];

    if (commissions.length === 0) return payouts;

    const sortedCommissions = [...commissions].sort(
      (a, b) => a.level - b.level
    );

    const totalCommissionPool = sortedCommissions.reduce(
      (sum, c) => sum + c.amount,
      BigInt(0)
    );

    const adminCommission = sortedCommissions[0];
    if (adminCommission && totalCommissionPool > 0) {
      payouts.push({
        fromUserId: "SYSTEM",
        toUserId: adminCommission.userId,
        amount: totalCommissionPool,
        level: adminCommission.level,
        roleName: adminCommission.roleName,
        commissionType: adminCommission.commissionType,
        commissionValue: adminCommission.commissionValue,
        narration: `Total commission pool for transaction ${transactionId}`,
      });

      console.log("SYSTEM payout to ADMIN", {
        toUserId: adminCommission.userId,
        amount: Number(totalCommissionPool) / 100,
      });
    }

    for (let i = 0; i < sortedCommissions.length - 1; i++) {
      const payer = sortedCommissions[i];
      const receiver = sortedCommissions[i + 1];

      if (payer && receiver && receiver.amount > 0) {
        payouts.push({
          fromUserId: payer.userId,
          toUserId: receiver.userId,
          amount: receiver.amount,
          level: receiver.level,
          roleName: receiver.roleName,
          commissionType: receiver.commissionType,
          commissionValue: receiver.commissionValue,
          narration: `Commission share for transaction ${transactionId} (${payer.roleName} → ${receiver.roleName})`,
        });

        console.log("Inter-level payout", {
          fromUserId: payer.userId,
          fromRole: payer.roleName,
          toUserId: receiver.userId,
          toRole: receiver.roleName,
          amount: Number(receiver.amount) / 100,
        });
      }
    }

    return payouts;
  }

  static async distribute(transaction, createdBy) {
    const { id: transactionId, serviceId, amount: txAmount } = transaction;
    const baseAmount = BigInt(txAmount);

    console.log("Starting commission distribution", {
      transactionId,
      userId: transaction.userId,
      serviceId,
      amount: Number(baseAmount) / 100,
    });

    const chain = await this.getCommissionChain(
      transaction.userId,
      serviceId,
      transaction.channel
    );

    if (chain.length === 0) {
      console.log("No commission chain found", { transactionId });
      return [];
    }

    console.log("Commission chain found", {
      transactionId,
      chainLength: chain.length,
      userIds: chain.map((m) => m.userId),
      roles: chain.map((m) => m.roleName),
      levels: chain.map((m) => m.level),
    });

    const hierarchicalCommissions = this.calculateHierarchicalCommissions(
      chain,
      baseAmount
    );

    const totalCommission = hierarchicalCommissions.reduce(
      (sum, c) => sum + c.amount,
      BigInt(0)
    );
    if (totalCommission === BigInt(0)) {
      console.log("No commission to distribute", { transactionId });
      return [];
    }

    console.log("Hierarchical commissions calculated", {
      transactionId,
      totalCommissionPool: Number(totalCommission) / 100,
      commissions: hierarchicalCommissions.map((c) => ({
        userId: c.userId,
        role: c.roleName,
        level: c.level,
        amount: Number(c.amount) / 100,
        type: c.commissionType,
        value: c.commissionValue,
      })),
    });

    const payouts = this.calculateCommissionPayouts(
      hierarchicalCommissions,
      transactionId
    );

    if (payouts.length === 0) {
      console.log("No commission payouts calculated", { transactionId });
      return [];
    }

    console.log("Commission payouts calculated", {
      transactionId,
      totalPayouts: payouts.length,
      payouts: payouts.map((p) => ({
        from: p.fromUserId,
        to: p.toUserId,
        fromRole: p.roleName,
        amount: Number(p.amount) / 100,
        level: p.level,
      })),
    });

    const createdEarnings = await Prisma.$transaction(async (tx) => {
      const earnings = [];

      for (const payout of payouts) {
        if (payout.fromUserId === "SYSTEM") {
          await this.creditUserWallet(
            tx,
            payout.toUserId,
            payout.amount,
            transactionId,
            payout.narration,
            createdBy
          );
        } else {
          await this.debitUserWallet(
            tx,
            payout.fromUserId,
            payout.amount,
            transactionId,
            `Commission paid to ${payout.toUserId} for transaction ${transactionId}`,
            createdBy
          );

          await this.creditUserWallet(
            tx,
            payout.toUserId,
            payout.amount,
            transactionId,
            payout.narration,
            createdBy
          );
        }

        const earningData = {
          userId: payout.toUserId,
          serviceId: serviceId,
          transactionId: transactionId,
          amount: payout.amount,
          commissionAmount: payout.amount,
          commissionType: payout.commissionType,
          level: payout.level,
          netAmount: payout.amount,
          createdBy: createdBy,
          metadata: {
            grossAmount: Number(payout.amount) / 100,
            commissionValue: payout.commissionValue,
            narration: payout.narration,
            fromUserId: payout.fromUserId,
            roleName: payout.roleName,
            poolDistribution: true,
            distributedAt: new Date().toISOString(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (payout.fromUserId !== "SYSTEM") {
          earningData.fromUserId = payout.fromUserId;
        }

        const earning = await tx.commissionEarning.create({
          data: earningData,
        });

        earnings.push(earning);

        console.log("Commission earning recorded", {
          transactionId,
          earningId: earning.id,
          from: payout.fromUserId,
          to: payout.toUserId,
          role: payout.roleName,
          amount: Number(payout.amount) / 100,
        });
      }

      return earnings;
    });

    const totalSystemCommission = payouts
      .filter((p) => p.fromUserId === "SYSTEM")
      .reduce((sum, payout) => sum + payout.amount, BigInt(0));

    console.log("Commission distribution completed successfully", {
      transactionId,
      distributedCount: createdEarnings.length,
      totalSystemCommission: Number(totalSystemCommission) / 100,
      payoutFlow: payouts.map(
        (p) =>
          `${p.fromUserId} (${p.roleName}) → ${p.toUserId} (₹${Number(p.amount) / 100})`
      ),
    });

    return createdEarnings;
  }

  static async creditUserWallet(
    tx,
    userId,
    amount,
    transactionId,
    narration,
    createdBy
  ) {
    const wallet = await tx.wallet.findFirst({
      where: {
        userId: userId,
        walletType: WalletType.PRIMARY,
        isActive: true,
      },
    });

    if (!wallet) {
      throw ApiError.internal(`Primary wallet not found for user ${userId}`);
    }

    const newBalance = wallet.balance + amount;
    const newAvailableBalance = newBalance - wallet.holdBalance;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        availableBalance: newAvailableBalance,
        version: { increment: 1 },
      },
    });

    await tx.ledgerEntry.create({
      data: {
        transactionId: transactionId,
        walletId: wallet.id,
        entryType: LedgerEntryType.CREDIT,
        referenceType: ReferenceType.COMMISSION,
        // moduleType removed - use serviceId from transaction
        amount: amount,
        runningBalance: newBalance,
        narration: narration,
        createdBy: createdBy,
        createdAt: new Date(),
      },
    });

    console.log("Wallet credited", {
      userId,
      amount: Number(amount) / 100,
      newBalance: Number(newBalance) / 100,
      transactionId,
    });
  }

  static async debitUserWallet(
    tx,
    userId,
    amount,
    transactionId,
    narration,
    createdBy
  ) {
    const wallet = await tx.wallet.findFirst({
      where: {
        userId: userId,
        walletType: WalletType.PRIMARY,
        isActive: true,
      },
    });

    if (!wallet) {
      throw ApiError.internal(`Primary wallet not found for user ${userId}`);
    }

    const currentBalance = wallet.balance;
    if (currentBalance < amount) {
      throw ApiError.internal(
        `Insufficient funds in wallet ${userId} for commission payout. Balance: ₹${Number(currentBalance) / 100}, Required: ₹${Number(amount) / 100}`
      );
    }

    const newBalance = currentBalance - amount;
    const newAvailableBalance = newBalance - wallet.holdBalance;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        availableBalance: newAvailableBalance,
        version: { increment: 1 },
      },
    });

    await tx.ledgerEntry.create({
      data: {
        transactionId: transactionId,
        walletId: wallet.id,
        entryType: LedgerEntryType.DEBIT,
        referenceType: ReferenceType.COMMISSION,
        // moduleType removed - use serviceId from transaction
        amount: amount,
        runningBalance: newBalance,
        narration: narration,
        createdBy: createdBy,
        createdAt: new Date(),
      },
    });

    console.log("Wallet debited", {
      userId,
      amount: Number(amount) / 100,
      newBalance: Number(newBalance) / 100,
      transactionId,
    });
  }
}

export default CommissionDistributionService;
