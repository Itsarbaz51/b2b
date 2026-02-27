import { ServiceProviderService } from "../services/service.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/AsyncHandler.js";

class ServiceProviderController {
  static create = asyncHandler(async (req, res) => {
    const user = req.user.id;

    if (!user) {
      throw ApiError.badRequest("Please login before creating a service");
    }

    const iconFile = req.file;

    if (iconFile) {
      if (iconFile.size > 5 * 1024 * 1024) {
        throw ApiError.badRequest("Icon file size must be less than 5 MB");
      }

      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedMimeTypes.includes(iconFile.mimetype)) {
        throw ApiError.badRequest("Icon file must be an image (jpeg/png/webp)");
      }
    }

    const serviceProvider = await ServiceProviderService.create(
      req.body,
      {
        icon: [iconFile],
      },
      req,
      res
    );

    return res
      .status(201)
      .json(
        ApiResponse.success(
          serviceProvider,
          `Service Provider ${serviceProvider.code} created successfully`,
          201
        )
      );
  });

  static getAll = asyncHandler(async (req, res) => {
    const user = req.user;
    const { type } = req.body; // 'all', 'active', 'inactive'

    let serviceProviders;

    if (user.role === "ADMIN" || user.roleType === "employee") {
      // ADMIN can see all services based on type
      switch (type) {
        case "active":
          serviceProviders = await ServiceProviderService.getActive();
          break;
        case "allServices":
          serviceProviders = await ServiceProviderService.allServices();
          break;
        default:
          serviceProviders = await ServiceProviderService.getAll();
      }
    } else {
      // Regular users can only see assigned services
      serviceProviders = await ServiceProviderService.getUserServices(user.id);
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          serviceProviders,
          "Service Providers fetched successfully",
          200
        )
      );
  });

  static updateEnvConfig = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { envConfig, subServices } = req.body;

    if (!id) {
      throw ApiError.badRequest("Service Provider ID is required");
    }

    const updatedServiceProvider = await ServiceProviderService.updateEnvConfig(
      id,
      {
        envConfig,
        subServices,
      },
      req,
      res
    );

    return res
      .status(200)
      .json(
        ApiResponse.success(
          updatedServiceProvider,
          "Environment configuration updated successfully",
          200
        )
      );
  });

  static toggleServiceStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest("Service ID is required");
    }

    const result = await ServiceProviderService.toggleServiceStatus(
      id,
      req,
      res
    );

    return res
      .status(200)
      .json(ApiResponse.success(result, "service updated", 200));
  });

  static toggleApiIntigrationStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest("Api Intigration ID is required");
    }

    const result = await ServiceProviderService.toggleApiIntigrationStatus(
      id,
      req,
      res
    );

    return res
      .status(200)
      .json(
        ApiResponse.success(result, "successfully Api Intigration chnage", 200)
      );
  });

  static apiTestConnection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { envConfig } = req.body;

    if (!id) {
      throw ApiError.badRequest("Service Provider ID is required");
    }

    const testResult = await ServiceProviderService.testApiConnection(
      id,
      envConfig,
      req,
      res
    );

    return res
      .status(200)
      .json(ApiResponse.success(testResult, "Connection test successful", 200));
  });
}

export default ServiceProviderController;
