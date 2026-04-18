import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { CryptoService } from "../utils/cryptoService.js";

export class ServiceService {
  // CREATE
  static async create(payload) {
    const { name, code, isActive } = payload;

    if (!name || !code) {
      throw ApiError.badRequest("Name and code required");
    }

    const exists = await Prisma.service.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (exists) throw ApiError.conflict("Service already exists");

    return Prisma.service.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        isActive: isActive ?? true,
      },
    });
  }

  // UPDATE
  static async update(id, payload) {
    const service = await Prisma.service.findUnique({ where: { id } });
    if (!service) throw ApiError.notFound("Service not found");

    return Prisma.service.update({
      where: { id },
      data: {
        name: payload.name,
        isActive: payload.isActive,
      },
    });
  }

  // GET ALL
  static async getAll({ page = 1, limit = 10, search, isActive }) {
    const skip = (page - 1) * limit;

    const where = {
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      Prisma.service.findMany({
        where,
        skip,
        take: limit,
        include: {
          mappings: {
            include: { provider: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      Prisma.service.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  // DELETE
  static async delete(id) {
    const service = await Prisma.service.findUnique({ where: { id } });
    if (!service) throw ApiError.notFound("Service not found");

    return Prisma.service.delete({ where: { id } });
  }

  static async getServicesByUser(
    user,
    { page = 1, limit = 10, search, isActive }
  ) {
    if (!user?.id) {
      throw ApiError.badRequest("User required");
    }

    const role = user?.role;
    const roleType = user?.roleType;

    const skip = (page - 1) * limit;

    // ADMIN / EMPLOYEE → ALL SERVICES
    if (role === "ADMIN" || roleType === "employee") {
      const where = {
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }),
      };

      const [data, total] = await Promise.all([
        Prisma.service.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        Prisma.service.count({ where }),
      ]);

      return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    // ROLE PERMISSIONS
    const rolePermissions = await Prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      include: {
        service: true,
      },
    });

    // USER PERMISSIONS
    const userPermissions = await Prisma.userPermission.findMany({
      where: { userId: user.id },
      include: {
        service: true,
      },
    });

    const serviceMap = {};

    // role services
    rolePermissions.forEach((perm) => {
      if (!perm.service) return;

      serviceMap[perm.serviceId] = {
        ...perm.service,
        source: "ROLE",
        canView: perm.canView,
        canProcess: perm.canProcess,
      };
    });

    // user override
    userPermissions.forEach((perm) => {
      if (!perm.service) return;

      serviceMap[perm.serviceId] = {
        ...perm.service,
        source: "USER",
        canView: perm.canView,
        canProcess: perm.canProcess,
      };
    });

    let services = Object.values(serviceMap);

    // search filter
    if (search) {
      services = services.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.code.toLowerCase().includes(search.toLowerCase())
      );
    }

    // active filter
    if (isActive !== undefined) {
      services = services.filter((s) => s.isActive === isActive);
    }

    const total = services.length;

    const paginated = services.slice(skip, skip + limit);

    return {
      data: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export class ProviderService {
  static async create(payload) {
    const { name, code, isActive } = payload;

    if (!name || !code) throw ApiError.badRequest("Name and code required");

    const exists = await Prisma.provider.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (exists) throw ApiError.conflict("Provider already exists");

    return Prisma.provider.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        isActive: isActive ?? true,
      },
    });
  }

  static async update(id, payload) {
    const provider = await Prisma.provider.findUnique({ where: { id } });
    if (!provider) throw ApiError.notFound("Provider not found");

    return Prisma.provider.update({
      where: { id },
      data: {
        name: payload.name,
        isActive: payload.isActive,
      },
    });
  }

  static async getAll({ page = 1, limit = 10, search, isActive }) {
    const skip = (page - 1) * limit;

    const where = {
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      Prisma.provider.findMany({
        where,
        skip,
        take: limit,
        include: {
          mappings: {
            include: {
              service: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      Prisma.provider.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async delete(id) {
    const provider = await Prisma.provider.findUnique({ where: { id } });
    if (!provider) throw ApiError.notFound("Provider not found");

    return Prisma.provider.delete({ where: { id } });
  }
}

export class MappingService {
  // CREATE
  static async create(payload) {
    const {
      serviceId,
      providerId,
      mode,
      pricingValueType,
      sellingPrice,
      providerCost,
      commissionStartLevel,
      supportsSlab,
      supportPaymentMethod,
      config,
      priority,
      isActive,
      applyTDS,
      tdsPercent,
      applyGST,
      gstPercent,
    } = payload;

    if (!serviceId || !providerId) {
      throw ApiError.badRequest("serviceId and providerId are required");
    }

    //  SLAB + PAYMENT METHOD RULE
    if (
      (supportsSlab || supportPaymentMethod) &&
      (providerCost || sellingPrice)
    ) {
      throw ApiError.badRequest(
        "Remove providerCost and sellingPrice when slab/payment method enabled"
      );
    }

    if (mode === "SURCHARGE" && sellingPrice) {
      throw ApiError.badRequest("Selling price not allowed in surcharge mode");
    }

    if (
      mode === "COMMISSION" &&
      !supportsSlab &&
      !supportPaymentMethod &&
      !sellingPrice
    ) {
      throw ApiError.badRequest("Selling price required in commission mode");
    }

    // GST
    if (applyGST && (!gstPercent || gstPercent <= 0)) {
      throw ApiError.badRequest("GST percent required");
    }

    if (applyTDS && (!tdsPercent || tdsPercent <= 0)) {
      throw ApiError.badRequest("TDS percent required");
    }

    if (mode === "SURCHARGE" && applyTDS) {
      throw ApiError.badRequest("TDS not allowed in surcharge mode");
    }

    if (mode === "COMMISSION" && applyGST) {
      throw ApiError.badRequest("GST not allowed in commission mode");
    }

    const exists = await Prisma.serviceProviderMapping.findUnique({
      where: {
        serviceId_providerId: {
          serviceId,
          providerId,
        },
      },
    });

    if (exists) throw ApiError.conflict("Mapping already exists");
    let encryptedConfig = null;
    if (config) {
      encryptedConfig = CryptoService.encrypt(JSON.stringify(config));
    }

    const finalSellingPrice =
      supportsSlab || supportPaymentMethod ? 0 : (sellingPrice ?? 0);

    const finalProviderCost =
      supportsSlab || supportPaymentMethod ? 0 : (providerCost ?? 0);

    return Prisma.serviceProviderMapping.create({
      data: {
        serviceId,
        providerId,

        mode: mode,
        pricingValueType: pricingValueType,

        sellingPrice: BigInt(finalSellingPrice),
        providerCost: BigInt(finalProviderCost),

        commissionStartLevel: commissionStartLevel,

        supportsSlab: supportsSlab ?? false,
        supportPaymentMethod: supportPaymentMethod ?? false,
        applyTDS: applyTDS ?? false,
        tdsPercent: applyTDS ? BigInt(tdsPercent) : null,

        applyGST: applyGST ?? false,
        gstPercent: applyGST ? BigInt(gstPercent) : null,
        config: encryptedConfig,
        priority: priority ?? 1,
        isActive: isActive ?? true,
      },

      include: {
        service: true,
        provider: true,
        providerSlabs: true,
      },
    });
  }

  // UPDATE
  static async update(id, payload) {
    const mapping = await Prisma.serviceProviderMapping.findUnique({
      where: { id },
    });

    if (!mapping) throw ApiError.notFound("Mapping not found");

    const {
      mode,
      pricingValueType,
      sellingPrice,
      providerCost,
      commissionStartLevel,
      supportsSlab,
      supportPaymentMethod,
      config,
      priority,
      isActive,
      applyTDS,
      tdsPercent,
      applyGST,
      gstPercent,
    } = payload;

    // =========================
    // VALIDATIONS
    // =========================

    if (
      (supportsSlab || supportPaymentMethod) &&
      (providerCost || sellingPrice)
    ) {
      throw ApiError.badRequest(
        "Remove providerCost and sellingPrice when slab/payment method enabled"
      );
    }
    if (mode === "SURCHARGE" && sellingPrice) {
      throw ApiError.badRequest("Selling price not allowed in surcharge mode");
    }

    if (
      mode === "COMMISSION" &&
      !supportsSlab &&
      !supportPaymentMethod &&
      !sellingPrice
    ) {
      throw ApiError.badRequest("Selling price required in commission mode");
    }

    // GST
    if (applyGST && (!gstPercent || gstPercent <= 0)) {
      throw ApiError.badRequest("GST percent required");
    }

    // TDS
    if (applyTDS && (!tdsPercent || tdsPercent <= 0)) {
      throw ApiError.badRequest("TDS percent required");
    }

    // Mode rules
    if (mode === "SURCHARGE" && applyTDS) {
      throw ApiError.badRequest("TDS not allowed in surcharge mode");
    }

    if (mode === "COMMISSION" && applyGST) {
      throw ApiError.badRequest("GST not allowed in commission mode");
    }

    // =========================
    // UPDATE
    // =========================
    let encryptedConfig;

    if (config !== undefined || config !== null) {
      encryptedConfig = config
        ? CryptoService.encrypt(JSON.stringify(config))
        : null; // allow clearing config
    }

    const isDynamicPricing = supportsSlab || supportPaymentMethod;
    const finalSellingPrice = isDynamicPricing
      ? 0
      : (sellingPrice ?? mapping.sellingPrice);
    const finalProviderCost = isDynamicPricing
      ? 0
      : (providerCost ?? mapping.providerCost);

    return Prisma.serviceProviderMapping.update({
      where: { id },

      data: {
        mode: mode ?? mapping.mode,
        pricingValueType: pricingValueType ?? mapping.pricingValueType,

        sellingPrice: BigInt(finalSellingPrice),
        providerCost: BigInt(finalProviderCost),

        supportsSlab: supportsSlab ?? mapping.supportsSlab,
        supportPaymentMethod:
          supportPaymentMethod ?? mapping.supportPaymentMethod,

        commissionStartLevel:
          commissionStartLevel ?? mapping.commissionStartLevel,

        //  GST / TDS FIX
        applyTDS: applyTDS ?? mapping.applyTDS,
        tdsPercent:
          applyTDS === true
            ? BigInt(tdsPercent)
            : applyTDS === false
              ? null
              : undefined,

        applyGST: applyGST ?? mapping.applyGST,
        gstPercent:
          applyGST === true
            ? BigInt(gstPercent)
            : applyGST === false
              ? null
              : undefined,

        config: config !== undefined ? encryptedConfig : undefined,
        priority: priority ?? mapping.priority,
        isActive: isActive ?? mapping.isActive,
      },

      include: {
        service: true,
        provider: true,
        providerSlabs: true,
      },
    });
  }

  // GET ALL
  static async getAll({ page = 1, limit = 10, search, isActive }) {
    const skip = (page - 1) * limit;

    const where = {
      ...(isActive !== undefined && { isActive }),

      ...(search && {
        OR: [
          {
            service: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            provider: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      Prisma.serviceProviderMapping.findMany({
        where,
        skip,
        take: limit,

        include: {
          service: true,
          provider: true,
          providerSlabs: true,
          paymentMethodCharges: true,
        },

        orderBy: {
          priority: "asc",
        },
      }),

      Prisma.serviceProviderMapping.count({ where }),
    ]);

    const decryptedData = data.map((item) => {
      if (item.config) {
        try {
          item.config = JSON.parse(CryptoService.decrypt(item.config));
        } catch (e) {
          console.error("Config decrypt failed", e);
          item.config = null;
        }
      }
      return item;
    });

    return {
      data: decryptedData,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // DELETE
  static async delete(id) {
    const mapping = await Prisma.serviceProviderMapping.findUnique({
      where: { id },
    });

    if (!mapping) throw ApiError.notFound("Mapping not found");

    return Prisma.serviceProviderMapping.delete({
      where: { id },
    });
  }
}

export class ProviderSlabService {
  static async upsert(payload) {
    const {
      id,
      _delete,
      serviceProviderMappingId,
      minAmount,
      maxAmount,
      providerCost,
      sellingPrice = 0,
    } = payload;

    // DELETE
    if (_delete && id) {
      return Prisma.providerSlab.delete({
        where: { id },
      });
    }

    const min = BigInt(minAmount);
    const max = BigInt(maxAmount);

    if (min >= max)
      throw ApiError.badRequest("Min amount must be less than max amount");

    // UPDATE
    if (id) {
      return Prisma.providerSlab.update({
        where: { id },
        data: {
          minAmount: min,
          maxAmount: max,
          providerCost: providerCost ? BigInt(providerCost) : 0,
          sellingPrice: sellingPrice ? BigInt(sellingPrice) : 0,
        },
      });
    }

    // CREATE
    return Prisma.providerSlab.create({
      data: {
        serviceProviderMappingId,
        minAmount: min,
        maxAmount: max,
        providerCost: providerCost ? BigInt(providerCost) : 0,
        sellingPrice: sellingPrice ? BigInt(sellingPrice) : 0,
      },
    });
  }
}

export class PaymentMethodChargeService {
  static async upsert(payload) {
    const {
      id,
      _delete,
      serviceProviderMappingId,
      paymentMethod,
      category,
      network,
      mode,
      type,
      value,
      serviceType,
      operator,
    } = payload;

    // ================= DELETE =================
    if (_delete && id) {
      return Prisma.paymentMethodChargeProvider.delete({
        where: { id },
      });
    }

    // ================= VALIDATION =================
    if (!serviceProviderMappingId) {
      throw ApiError.badRequest("Mapping ID required");
    }

    if (!type) {
      throw ApiError.badRequest("Type required");
    }

    if (value === undefined || value === null) {
      throw ApiError.badRequest("Value required");
    }

    const parsedValue = BigInt(value);

    if (parsedValue < 0n) {
      throw ApiError.badRequest("Value must be >= 0");
    }

    // ================= FETCH MAPPING =================
    const mapping = await Prisma.serviceProviderMapping.findUnique({
      where: { id: serviceProviderMappingId },
      select: {
        id: true,
        mode: true,
        isActive: true,
        supportsSlab: true,
        service: {
          select: { code: true },
        },
      },
    });

    if (!mapping) {
      throw ApiError.notFound("Service mapping not found");
    }

    const serviceCode = mapping.service?.code;
    const isBbps = serviceCode === "BBPS";
    const isFund = serviceCode === "FUND_REQUEST";

    // ================= COMMON RULES =================
    if (!mapping.isActive) {
      throw ApiError.badRequest("Mapping is inactive");
    }

    if (mapping.supportsSlab) {
      throw ApiError.badRequest(
        "Payment method charges not allowed with slab pricing"
      );
    }

    // ================= FUND VALIDATION =================
    if (isFund) {
      if (!paymentMethod) {
        throw ApiError.badRequest("Payment method required");
      }

      if (!serviceType) {
        throw ApiError.badRequest("Service type required");
      }

      if (paymentMethod === "CARD" && !network) {
        throw ApiError.badRequest("Network required for CARD");
      }
    }

    // ================= BBPS VALIDATION =================
    if (isBbps) {
      if (!category) {
        throw ApiError.badRequest("Category required for BBPS");
      }

      if (!operator) {
        throw ApiError.badRequest("Operator required for BBPS");
      }

      if (!serviceType) {
        throw ApiError.badRequest("Service type required");
      }
    }

    // ================= DUPLICATE CHECK =================
    const exists = await Prisma.paymentMethodChargeProvider.findFirst({
      where: {
        serviceProviderMappingId,
        paymentMethod: isFund ? paymentMethod : null,
        network: isFund && paymentMethod === "CARD" ? network : null,
        category: isBbps ? category : null,
        operator: isBbps ? operator : null,
        serviceType: serviceType,
        NOT: id ? { id } : undefined,
      },
    });

    if (exists) {
      throw ApiError.conflict("Charge already exists for this configuration");
    }

    // ================= COMMON DATA =================
    const data = {
      serviceProviderMappingId,
      paymentMethod: isFund ? paymentMethod : null,
      network: isFund && paymentMethod === "CARD" ? network : null,
      category: isBbps ? category : null,
      operator: isBbps ? operator : null,
      serviceType: serviceType,
      mode: mode,
      pricingValueType: type.toUpperCase(),
      value: parsedValue,
    };

    // ================= UPDATE =================
    if (id) {
      return Prisma.paymentMethodChargeProvider.update({
        where: { id },
        data,
      });
    }

    // ================= CREATE =================
    return Prisma.paymentMethodChargeProvider.create({
      data,
    });
  }
}
