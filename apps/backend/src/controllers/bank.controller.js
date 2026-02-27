import asyncHandler from "../utils/AsyncHandler.js";
import { BankDetailService } from "../services/bank.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ===================== USER BANK CONTROLLER =====================

export class AddBankController {
  static index = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || !role)
      throw ApiError.unauthorized("User not authenticated or role missing");

    const {
      search,
      status,
      page = "1",
      limit = "10",
      sort = "desc",
    } = req.body;

    const sortOrder = sort === "asc" ? "asc" : "desc";

    const params = {
      userId,
      role: role,
      page: Number(page),
      limit: Number(limit),
      sort: sortOrder,
      status,
      search,
    };

    const data = await BankDetailService.index(params, req);

    return res
      .status(200)
      .json(
        ApiResponse.success(data, "Bank details fetched successfully", 200)
      );
  });

  static getAllMyBanks = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const data = await BankDetailService.getAllMy(userId, req);

    return res
      .status(200)
      .json(
        ApiResponse.success(data, "All bank details fetched successfully", 200)
      );
  });

  static show = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const { id } = req.params;
    if (!id) throw ApiError.badRequest("ID missing");

    const data = await BankDetailService.show(id, userId, req, res);
    return res
      .status(200)
      .json(ApiResponse.success(data, "Bank detail fetched successfully", 200));
  });

  static store = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const file = req.file;

    if (!file) {
      throw ApiError.badRequest("file are required (Bank Proof).");
    }

    const data = await BankDetailService.store(
      {
        ...req.body,
        bankProofFile: file,
        userId,
      },
      req,
      res
    );

    return res
      .status(201)
      .json(ApiResponse.success(data, "Bank detail added successfully", 201));
  });

  static update = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const { id } = req.params;
    if (!id) throw ApiError.badRequest("ID missing");

    if (!id) throw ApiError.internal("Bank detail ID is required");

    const files = req.files;
    const data = await BankDetailService.update(
      id,
      userId,
      {
        ...req.body,
        bankProofFile: files?.bankProofFile?.[0],
      },
      req,
      res
    );

    return res
      .status(200)
      .json(ApiResponse.success(data, "Bank detail updated successfully", 200));
  });

  static destroy = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const { id } = req.params;
    if (!id) throw ApiError.badRequest("ID missing");

    if (!id) throw ApiError.internal("Bank detail ID is required");

    const result = await BankDetailService.destroy(id, userId, req, res);
    return res
      .status(200)
      .json(
        ApiResponse.success(result, "Bank detail deleted successfully", 200)
      );
  });

  static verify = asyncHandler(async (req, res) => {
    const { id, status, bankRejectionReason } = req.body;
    const userId = req.user?.id;

    if (!id) throw ApiError.badRequest("Bank ID is required");
    if (!userId) throw ApiError.unauthorized("User not authenticated");

    const updatedBank = await BankDetailService.verification(
      id,
      userId,
      {
        status,
        bankRejectionReason: bankRejectionReason ?? null,
      },
      req,
      res
    );

    return res
      .status(200)
      .json(
        ApiResponse.success(
          updatedBank,
          "Bank verification updated successfully"
        )
      );
  });
}

export default { AddBankController };
