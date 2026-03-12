import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

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
      config,
      priority,
      isActive,
    } = payload;

    if (!serviceId || !providerId) {
      throw ApiError.badRequest("serviceId and providerId are required");
    }
    if (supportsSlab && (providerCost || sellingPrice))
      throw ApiError.badRequest(
        "Remove providerCost and sellingPrice when slabs enabled"
      );

    if (mode === "SURCHARGE" && sellingPrice)
      throw ApiError.badRequest("Selling price not allowed in surcharge mode");

    if (mode === "COMMISSION" && !sellingPrice)
      throw ApiError.badRequest("Selling price required in commission mode");

    const exists = await Prisma.serviceProviderMapping.findUnique({
      where: {
        serviceId_providerId: {
          serviceId,
          providerId,
        },
      },
    });

    if (exists) throw ApiError.conflict("Mapping already exists");

    return Prisma.serviceProviderMapping.create({
      data: {
        serviceId,
        providerId,

        mode: mode,
        pricingValueType: pricingValueType,

        sellingPrice: sellingPrice !== undefined ? BigInt(sellingPrice) : 0,

        providerCost: providerCost !== undefined ? BigInt(providerCost) : 0,

        commissionStartLevel: commissionStartLevel,

        supportsSlab: supportsSlab ?? false,

        config: config,
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

    if (payload.supportsSlab && (payload.providerCost || payload.sellingPrice))
      throw ApiError.badRequest(
        "Remove providerCost and sellingPrice when slabs enabled"
      );

    if (payload.mode === "SURCHARGE" && payload.sellingPrice)
      throw ApiError.badRequest("Selling price not allowed in surcharge mode");

    if (payload.mode === "COMMISSION" && !payload.sellingPrice)
      throw ApiError.badRequest("Selling price required in commission mode");

    if (!mapping) throw ApiError.notFound("Mapping not found");

    return Prisma.serviceProviderMapping.update({
      where: { id },

      data: {
        mode: payload.mode,
        pricingValueType: payload.pricingValueType,

        sellingPrice:
          payload.sellingPrice !== undefined
            ? BigInt(payload.sellingPrice)
            : undefined,

        providerCost:
          payload.providerCost !== undefined
            ? BigInt(payload.providerCost)
            : undefined,

        commissionStartLevel: payload.commissionStartLevel,
        supportsSlab: payload.supportsSlab,

        config: payload.config,
        priority: payload.priority,
        isActive: payload.isActive,
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
        },

        orderBy: {
          priority: "asc",
        },
      }),

      Prisma.serviceProviderMapping.count({ where }),
    ]);

    return {
      data,
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
  // CREATE
  static async create(payload) {
    const {
      serviceProviderMappingId,
      minAmount,
      maxAmount,
      mode,
      pricingValueType,
      providerCost,
      sellingPrice,
    } = payload;

    if (!serviceProviderMappingId)
      throw ApiError.badRequest("Mapping id required");

    if (mode === "SURCHARGE" && sellingPrice)
      throw ApiError.badRequest("Selling price not allowed in surcharge mode");

    if (mode === "COMMISSION" && !sellingPrice)
      throw ApiError.badRequest("Selling price required in commission mode");

    const mapping = await Prisma.serviceProviderMapping.findUnique({
      where: { id: serviceProviderMappingId },
    });

    if (!mapping) throw ApiError.notFound("Mapping not found");

    if (!mapping.isActive) throw ApiError.badRequest("Mapping is inactive");

    if (!mapping.supportsSlab)
      throw ApiError.badRequest("Slabs not enabled for this mapping");

    const min = BigInt(minAmount);
    const max = BigInt(maxAmount);

    if (min >= max)
      throw ApiError.badRequest("Min amount must be less than max amount");

    // OVERLAP CHECK
    const overlap = await Prisma.providerSlab.findFirst({
      where: {
        serviceProviderMappingId,
        minAmount: { lte: max },
        maxAmount: { gte: min },
      },
    });

    if (overlap) throw ApiError.conflict("Slab range overlap");

    return Prisma.providerSlab.create({
      data: {
        serviceProviderMappingId,

        minAmount: min,
        maxAmount: max,

        mode: mode ?? "COMMISSION",
        pricingValueType: pricingValueType ?? "FLAT",

        providerCost:
          providerCost !== undefined && providerCost !== null
            ? BigInt(providerCost)
            : null,

        sellingPrice:
          sellingPrice !== undefined && sellingPrice !== null
            ? BigInt(sellingPrice)
            : null,
      },
    });
  }

  // UPDATE
  static async update(id, payload) {
    const slab = await Prisma.providerSlab.findUnique({
      where: { id },
    });

    if (!slab) throw ApiError.notFound("Slab not found");
    if (payload.mode === "SURCHARGE" && payload.sellingPrice)
      throw ApiError.badRequest("Selling price not allowed in surcharge mode");

    if (payload.mode === "COMMISSION" && !payload.sellingPrice)
      throw ApiError.badRequest("Selling price required in commission mode");

    return Prisma.providerSlab.update({
      where: { id },

      data: {
        minAmount:
          payload.minAmount !== undefined
            ? BigInt(payload.minAmount)
            : undefined,

        maxAmount:
          payload.maxAmount !== undefined
            ? BigInt(payload.maxAmount)
            : undefined,

        mode: payload.mode,
        pricingValueType: payload.pricingValueType,

        providerCost:
          payload.providerCost !== undefined
            ? BigInt(payload.providerCost)
            : undefined,

        sellingPrice:
          payload.sellingPrice !== undefined
            ? BigInt(payload.sellingPrice)
            : undefined,
      },
    });
  }

  // DELETE
  static async delete(id) {
    const slab = await Prisma.providerSlab.findUnique({
      where: { id },
    });

    if (!slab) throw ApiError.notFound("Slab not found");

    return Prisma.providerSlab.delete({
      where: { id },
    });
  }
}
