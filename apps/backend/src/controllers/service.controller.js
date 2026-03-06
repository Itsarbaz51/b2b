import {
  MappingService,
  ProviderService,
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

    let result;

    if (type === "service") result = await ServiceService.create(req.body);
    else if (type === "provider")
      result = await ProviderService.create(req.body);
    else if (type === "mapping") result = await MappingService.create(req.body);
    else throw ApiError.badRequest("Invalid type");

    res.status(201).json(ApiResponse.success(Helper.serializeUser(result)));
  });

  // UPDATE
  static update = asyncHandler(async (req, res) => {
    const { type } = req.body;
    const { id } = req.params;

    if (!type) throw ApiError.badRequest("Type is required");
    if (!id) throw ApiError.badRequest("ID is required");

    let result;

    if (type === "service") {
      result = await ServiceService.update(id, req.body);
    } else if (type === "provider") {
      result = await ProviderService.update(id, req.body);
    } else if (type === "mapping") {
      result = await MappingService.update(id, req.body);
    } else {
      throw ApiError.badRequest("Invalid type");
    }

    return res.json(
      ApiResponse.success(
        Helper.serializeUser(result),
        `${type} updated successfully`
      )
    );
  });

  // GET ALL (Filter + Search + Pagination)
  static getAll = asyncHandler(async (req, res) => {
    const { type, page, limit, search, isActive } = req.body;

    console.log(type);
    console.log(isActive);

    if (!type) throw ApiError.badRequest("Type is required");

    const pagination = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    };

    let result;

    if (type === "service") {
      result = await ServiceService.getAll({
        ...pagination,
        search,
        isActive: isActive !== undefined ? isActive === true : undefined,
      });
    } else if (type === "provider") {
      result = await ProviderService.getAll({
        ...pagination,
        search,
        isActive: isActive !== undefined ? isActive === true : undefined,
      });
    } else if (type === "mapping") {
      result = await MappingService.getAll(pagination);
    } else {
      throw ApiError.badRequest("Invalid type");
    }

    return res.json(ApiResponse.success(Helper.serializeUser(result)));
  });

  // DELETE
  static delete = asyncHandler(async (req, res) => {
    const { type } = req.body;
    const { id } = req.params;

    if (!type) throw ApiError.badRequest("Type is required");
    if (!id) throw ApiError.badRequest("ID is required");

    let result;

    if (type === "service") {
      result = await ServiceService.delete(id);
    } else if (type === "provider") {
      result = await ProviderService.delete(id);
    } else if (type === "mapping") {
      result = await MappingService.delete(id);
    } else {
      throw ApiError.badRequest("Invalid type");
    }

    return res.json(
      ApiResponse.success(
        Helper.serializeUser(result),
        `${type} deleted successfully`
      )
    );
  });
}

export default ServiceProviderController;
