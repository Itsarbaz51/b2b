import asyncHandler from "../utils/AsyncHandler.js";
import KycServices from "../services/kyc.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

class UserKycController {
  static index = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      throw ApiError.internal("User ID not found in request");
    }

    const { status, page, limit, sort, search } = req.body;

    const allKyc = await KycServices.indexUserKyc({
      userId,
      status,
      page,
      limit,
      sort,
      search,
    });

    return res
      .status(200)
      .json(
        ApiResponse.success(allKyc, "User KYC list fetched successfully", 200)
      );
  });

  static show = asyncHandler(async (req, res) => {
    const requestingUser = req.user;
    if (!requestingUser) {
      throw ApiError.unauthorized("User not authenticated");
    }

    const { id } = req.params;

    if (!id) throw ApiError.badRequest("id is missing");

    const kyc = await KycServices.showUserKyc(id, requestingUser);

    return res
      .status(200)
      .json(ApiResponse.success(kyc, "KYC fetched successfully", 200));
  });

  static store = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const files = req.files;

    const panFile = files.panFile?.[0];
    const aadhaarFile = files.aadhaarFile?.[0];
    const addressProofFile = files.addressProofFile?.[0];
    const photo = files.photo?.[0];

    if (!panFile || !aadhaarFile || !addressProofFile || !photo) {
      throw ApiError.badRequest(
        "All KYC files are required (PAN, Aadhaar, Address Proof, Photo)."
      );
    }

    const dbStoreData = await KycServices.storeUserKyc(
      {
        ...req.body,

        panFile,
        aadhaarFile,
        addressProofFile,
        photo,
        userId,
      },
      req,
      res
    );

    return res
      .status(201)
      .json(
        ApiResponse.success(
          dbStoreData,
          "User KYC submitted, waiting for approval",
          201
        )
      );
  });

  static update = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const { id } = req.params;
    if (!id) throw ApiError.badRequest("KYC ID is required in params");

    const files = req.files;

    const panFile = files.panFile?.[0];
    const aadhaarFile = files.aadhaarFile?.[0];
    const addressProofFile = files.addressProofFile?.[0];
    const photo = files.photo?.[0];

    const updateData = {
      ...req.body,
      userId, // Pass userId to service for validation
    };

    if (panFile) updateData.panFile = panFile;
    if (aadhaarFile) updateData.aadhaarFile = aadhaarFile;
    if (addressProofFile) updateData.addressProofFile = addressProofFile;
    if (photo) updateData.photo = photo;

    const dbUpdateData = await KycServices.updateUserKyc(
      id,
      updateData,
      req,
      res
    );

    return res
      .status(200)
      .json(
        ApiResponse.success(dbUpdateData, "User KYC updated successfully", 200)
      );
  });

  static verification = asyncHandler(async (req, res) => {
    const dbStoreData = await KycServices.verifyUserKyc(req.body, req, res);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          dbStoreData,
          `User KYC ${req.body.status} successfully`,
          200
        )
      );
  });
}

export { UserKycController };
