import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export class ServiceProviderService {
  // CREATE
  static async create(payload) {
    const { name, code, description, isActive } = payload;

    if (!name || !code) {
      throw ApiError.badRequest("Name and code are required");
    }

    const exists = await Prisma.serviceProvider.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (exists) {
      throw ApiError.conflict("Service Provider code already exists");
    }

    return Prisma.serviceProvider.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description || null,
        isActive: isActive ?? true,
      },
    });
  }

  // UPDATE
  static async update(id, payload) {
    const existing = await Prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!existing) throw ApiError.notFound("Service Provider not found");

    return Prisma.serviceProvider.update({
      where: { id },
      data: {
        name: payload.name?.trim(),
        description: payload.description,
        isActive: payload.isActive,
      },
    });
  }

  // GET ALL + FILTER + SEARCH + PAGINATION
  static async getAll({ page = 1, limit = 10, search, isActive }) {
    const skip = (page - 1) * limit;

    const where = {
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [{ name: { contains: search } }, { code: { contains: search } }],
      }),
    };

    const [data, total] = await Promise.all([
      Prisma.serviceProvider.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { services: true },
      }),
      Prisma.serviceProvider.count({ where }),
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
    const existing = await Prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!existing) throw ApiError.notFound("Service Provider not found");

    return Prisma.serviceProvider.delete({
      where: { id },
    });
  }
}

export class ServiceService {
  // CREATE
  static async create(payload) {
    const { name, code, providerId, isActive } = payload;

    if (!name || !code || !providerId) {
      throw ApiError.badRequest("Name, code and providerId required");
    }

    const provider = await Prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) throw ApiError.notFound("Provider not found");

    return Prisma.service.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        providerId,
        isActive: isActive ?? true,
      },
    });
  }

  // UPDATE
  static async update(id, payload) {
    const existing = await Prisma.service.findUnique({
      where: { id },
    });

    if (!existing) throw ApiError.notFound("Service not found");

    return Prisma.service.update({
      where: { id },
      data: {
        name: payload.name,
        isActive: payload.isActive,
      },
    });
  }

  // GET ALL + FILTER + SEARCH + PAGINATION
  static async getAll({ page = 1, limit = 10, search, providerId, isActive }) {
    const skip = (page - 1) * limit;

    const where = {
      ...(providerId && { providerId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [{ name: { contains: search } }, { code: { contains: search } }],
      }),
    };

    const [data, total] = await Promise.all([
      Prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { provider: true },
      }),
      Prisma.service.count({ where }),
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
    const existing = await Prisma.service.findUnique({
      where: { id },
    });

    if (!existing) throw ApiError.notFound("Service not found");

    return Prisma.service.delete({
      where: { id },
    });
  }
}
