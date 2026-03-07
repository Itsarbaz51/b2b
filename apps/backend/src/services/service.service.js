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
      sellingPrice,
      providerCost,
      config,
      priority,
      isActive,
    } = payload;

    if (!serviceId || !providerId) {
      throw ApiError.badRequest("serviceId and providerId are required");
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

    return Prisma.serviceProviderMapping.create({
      data: {
        serviceId,
        providerId,

        mode: mode ?? "COMMISSION",

        sellingPrice: sellingPrice ? BigInt(sellingPrice) : null,
        providerCost: providerCost ? BigInt(providerCost) : null,

        config: config ?? null,
        priority: priority ?? 1,
        isActive: isActive ?? true,
      },
      include: {
        service: true,
        provider: true,
      },
    });
  }

  // UPDATE
  static async update(id, payload) {
    const mapping = await Prisma.serviceProviderMapping.findUnique({
      where: { id },
    });

    if (!mapping) throw ApiError.notFound("Mapping not found");

    return Prisma.serviceProviderMapping.update({
      where: { id },
      data: {
        mode: payload.mode,

        sellingPrice:
          payload.sellingPrice !== undefined
            ? BigInt(payload.sellingPrice)
            : undefined,

        providerCost:
          payload.providerCost !== undefined
            ? BigInt(payload.providerCost)
            : undefined,

        config: payload.config,
        priority: payload.priority,
        isActive: payload.isActive,
      },
      include: {
        service: true,
        provider: true,
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
