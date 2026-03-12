import {
  MappingService,
  ProviderService,
  ProviderSlabService,
  ServiceService,
} from "../services/service.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/AsyncHandler.js";
import Helper from "../utils/helper.js";

class ServiceProviderController {
  // CREATE
  static create = asyncHandler(async (req, res) => {
    const { type } = req.body;

    if (!type) throw ApiError.badRequest("Type is required");

    let result;

    switch (type) {
      case "service":
        result = await ServiceService.create(req.body);
        break;

      case "provider":
        result = await ProviderService.create(req.body);
        break;

      case "mapping":
        result = await MappingService.create(req.body);
        break;

      case "slab":
        result = await ProviderSlabService.create(req.body);
        break;

      default:
        throw ApiError.badRequest("Invalid type");
    }

    return res
      .status(201)
      .json(ApiResponse.success(Helper.serializeBigInt(result)));
  });

  // UPDATE
  static update = asyncHandler(async (req, res) => {
    const { type } = req.body;
    const { id } = req.params;

    if (!type) throw ApiError.badRequest("Type is required");
    if (!id) throw ApiError.badRequest("ID is required");

    let result;

    switch (type) {
      case "service":
        result = await ServiceService.update(id, req.body);
        break;

      case "provider":
        result = await ProviderService.update(id, req.body);
        break;

      case "mapping":
        result = await MappingService.update(id, req.body);
        break;

      case "slab":
        result = await ProviderSlabService.update(id, req.body);
        break;

      default:
        throw ApiError.badRequest("Invalid type");
    }

    return res.json(
      ApiResponse.success(
        Helper.serializeBigInt(result),
        `${type} updated successfully`
      )
    );
  });

  // GET ALL (Filter + Search + Pagination)
  static getAll = asyncHandler(async (req, res) => {
    const { type, page, limit, search, isActive } = req.body;

    if (!type) throw ApiError.badRequest("Type is required");

    const pagination = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    };

    const activeFilter = isActive !== undefined ? isActive === true : undefined;

    let result;

    switch (type) {
      case "service":
        result = await ServiceService.getAll({
          ...pagination,
          search,
          isActive: activeFilter,
        });
        break;

      case "provider":
        result = await ProviderService.getAll({
          ...pagination,
          search,
          isActive: activeFilter,
        });
        break;

      case "mapping":
        result = await MappingService.getAll({
          ...pagination,
          search,
          isActive: activeFilter,
        });
        break;

      default:
        throw ApiError.badRequest("Invalid type");
    }

    return res.json(ApiResponse.success(Helper.serializeBigInt(result)));
  });

  // DELETE
  static delete = asyncHandler(async (req, res) => {
    const { type } = req.body;
    const { id } = req.params;

    if (!type) throw ApiError.badRequest("Type is required");
    if (!id) throw ApiError.badRequest("ID is required");

    let result;

    switch (type) {
      case "service":
        result = await ServiceService.delete(id);
        break;

      case "provider":
        result = await ProviderService.delete(id);
        break;

      case "mapping":
        result = await MappingService.delete(id);
        break;

      case "slab":
        result = await ProviderSlabService.delete(id);
        break;

      default:
        throw ApiError.badRequest("Invalid type");
    }

    return res.json(
      ApiResponse.success(
        Helper.serializeBigInt(result),
        `${type} deleted successfully`
      )
    );
  });

  static getServices = asyncHandler(async (req, res) => {
    const result = await ServiceService.getServicesByUser(req.user, req.query);

    return res.json(
      ApiResponse.success(Helper.serializeBigInt(result), `successfully get`)
    );
  });
}

export default ServiceProviderController;
