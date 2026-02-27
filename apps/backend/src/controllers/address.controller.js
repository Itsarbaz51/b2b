import asyncHandler from "../utils/AsyncHandler.js";
import AddressValidationSchemas from "../validations/addressValidation.schemas.js";
import AddressServices from "../services/address.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

class AddressController {
  static show = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      throw ApiError.badRequest("Address ID is required");
    }
    const dbShowData = await AddressServices.showAddress(id);
    res
      .status(201)
      .json(
        ApiResponse.success(dbShowData, "Address fetched successfully", 201)
      );
  });
  static store = asyncHandler(async (req, res) => {
    const dbStoreData = await AddressServices.storeUserAddress(req.body);
    if (!dbStoreData) {
      throw ApiError.internal("Failed to create address");
    }
    res
      .status(201)
      .json(
        ApiResponse.success(dbStoreData, "Address created successfully", 201)
      );
  });
  static update = asyncHandler(async (req, res) => {
    const validatedData = await AddressValidationSchemas.Address.parseAsync(
      req.body
    );
    const { id } = req.params;
    if (!id) {
      throw ApiError.badRequest("Address ID is required");
    }
    const dbUpdateData = await AddressServices.updateUserAddress(
      validatedData,
      id
    );
    res
      .status(201)
      .json(
        ApiResponse.success(dbUpdateData, "Address updated successfully", 201)
      );
  });
  static destroy = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      throw ApiError.badRequest("Address ID is requir");
    }
    const dbDeleteData = await AddressServices.deleteUserAddress(id);
    res
      .status(201)
      .json(
        ApiResponse.success(dbDeleteData, "Address deleted successfully", 201)
      );
  });
}

class StateController {
  static index = asyncHandler(async (req, res) => {
    const dbStoreData = await AddressServices.indexState();
    res
      .status(201)
      .json(
        ApiResponse.success(dbStoreData, "States fetched successfully", 201)
      );
  });
  static store = asyncHandler(async (req, res) => {
    const validatedData = await AddressValidationSchemas.State.parseAsync(
      req.body
    );

    const dbStoreData = await AddressServices.storeState(validatedData);

    res
      .status(201)
      .json(
        ApiResponse.success(dbStoreData, "State created successfully", 201)
      );
  });
  static update = asyncHandler(async (req, res) => {
    const validatedData = await AddressValidationSchemas.State.parseAsync(
      req.body
    );

    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest("State ID is required");
    }

    const dbUpdateData = await AddressServices.updateState(validatedData, id);

    res
      .status(201)
      .json(
        ApiResponse.success(dbUpdateData, "State updated successfully", 201)
      );
  });
  static destroy = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest("State ID is required");
    }

    const dbDeleteData = await AddressServices.deleteState(id);
    res
      .status(201)
      .json(
        ApiResponse.success(dbDeleteData, "State deleted successfully", 201)
      );
  });
}

class CityController {
  static index = asyncHandler(async (req, res) => {
    const dbStoreData = await AddressServices.indexCity();
    res
      .status(201)
      .json(
        ApiResponse.success(dbStoreData, "Cities fetched successfully", 201)
      );
  });
  static store = asyncHandler(async (req, res) => {
    const validatedData = await AddressValidationSchemas.City.parseAsync(
      req.body
    );

    const dbStoreData = await AddressServices.storeCity(validatedData);

    res
      .status(201)
      .json(ApiResponse.success(dbStoreData, "City created successfully", 201));
  });
  static update = asyncHandler(async (req, res) => {
    const validatedData = await AddressValidationSchemas.City.parseAsync(
      req.body
    );
    const { id } = req.params;
    if (!id) {
      throw ApiError.badRequest("City ID is required");
    }
    const dbUpdateData = await AddressServices.updateCity(validatedData, id);
    res
      .status(201)
      .json(
        ApiResponse.success(dbUpdateData, "City updated successfully", 201)
      );
  });
  static destroy = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      throw ApiError.badRequest("City ID is required");
    }
    const dbDeleteData = await AddressServices.deleteCity(id);
    res
      .status(201)
      .json(
        ApiResponse.success(dbDeleteData, "City deleted successfully", 201)
      );
  });
}

export { AddressController, StateController, CityController };
