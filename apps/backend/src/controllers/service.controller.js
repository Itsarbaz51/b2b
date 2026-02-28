import {
  ServiceProviderService,
  ServiceService,
} from "../services/service.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/AsyncHandler.js";

class ServiceProviderController {
  // CREATE
  static create = asyncHandler(async (req, res) => {
    const { type } = req.body;

    if (!type) throw ApiError.badRequest("Type is required");

    let result;

    if (type === "provider") {
      result = await ServiceProviderService.create(req.body);
    } else if (type === "service") {
      result = await ServiceService.create(req.body);
    } else {
      throw ApiError.badRequest("Invalid type. Use provider or service");
    }

    return res
      .status(201)
      .json(ApiResponse.success(result, `${type} created successfully`));
  });

  // UPDATE
  static update = asyncHandler(async (req, res) => {
    const { type } = req.body;
    const { id } = req.params;

    if (!type) throw ApiError.badRequest("Type is required");
    if (!id) throw ApiError.badRequest("ID is required");

    let result;

    if (type === "provider") {
      result = await ServiceProviderService.update(id, req.body);
    } else if (type === "service") {
      result = await ServiceService.update(id, req.body);
    } else {
      throw ApiError.badRequest("Invalid type");
    }

    return res.json(
      ApiResponse.success(result, `${type} updated successfully`)
    );
  });

  // GET ALL (Filter + Search + Pagination)
  static getAll = asyncHandler(async (req, res) => {
    const { type, page, limit, search, isActive, providerId } = req.query;

    if (!type) throw ApiError.badRequest("Type is required");

    let result;

    if (type === "provider") {
      result = await ServiceProviderService.getAll({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
      });
    } else if (type === "service") {
      result = await ServiceService.getAll({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        providerId,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
      });
    } else {
      throw ApiError.badRequest("Invalid type");
    }

    return res.json(ApiResponse.success(result));
  });

  // DELETE
  static delete = asyncHandler(async (req, res) => {
    const { type } = req.body;
    const { id } = req.params;

    if (!type) throw ApiError.badRequest("Type is required");

    let result;

    if (type === "provider") {
      result = await ServiceProviderService.delete(id);
    } else if (type === "service") {
      result = await ServiceService.delete(id);
    } else {
      throw ApiError.badRequest("Invalid type");
    }

    return res.json(
      ApiResponse.success(result, `${type} deleted successfully`)
    );
  });
}

export default ServiceProviderController;
