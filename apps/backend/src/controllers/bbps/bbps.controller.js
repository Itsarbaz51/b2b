import BbpsService from "../../services/bbps/bbps.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/AsyncHandler.js";
import Helper from "../../utils/helper.js";

class BbpsController {
  static listCategories = asyncHandler(async (req, res) => {
    const result = await BbpsService.listCategories(req.body, req.user);

    return res.json(
      ApiResponse.success(result, "Categories fetched successfully")
    );
  });

  static selectBiller = asyncHandler(async (req, res) => {
    const payload = {
      biller: req.body.biller,
      serviceProviderMappingId: req.body.serviceProviderMappingId,
    };

    const result = await BbpsService.selectBiller(payload, req.user);

    return res.json(
      ApiResponse.success(result, "Biller list fetched successfully")
    );
  });

  static fetchBill = asyncHandler(async (req, res) => {
    const payload = {
      billerId: req.body.billerId,
      custParam: req.body.custParam,
      reference: req.body.reference,
      serviceProviderMappingId: req.body.serviceProviderMappingId,
    };

    const result = await BbpsService.fetchBill(payload, req.user);

    return res.json(
      ApiResponse.success(
        Helper.serializeBigInt(result),
        "Bill fetched successfully"
      )
    );
  });

  static payBill = asyncHandler(async (req, res) => {
    const payload = {
      fetchId: req.body.fetchId,
      amount: req.body.amount,
      reference: req.body.reference,
      serviceProviderMappingId: req.body.serviceProviderMappingId,
    };

    const result = await BbpsService.payBill(payload, req.user);

    return res.json(
      ApiResponse.success(
        Helper.serializeBigInt(result),
        "Bill payment successful"
      )
    );
  });

  static checkStatus = asyncHandler(async (req, res) => {
    const payload = {
      transactionId: req.body.transactionId,
      serviceProviderMappingId: req.body.serviceProviderMappingId,
    };

    const result = await BbpsService.checkStatus(payload, req.user);

    return res.json(ApiResponse.success(result, "Status fetched successfully"));
  });

  static listTransactions = asyncHandler(async (req, res) => {
    const payload = {
      page: req.body.page,
      limit: req.body.limit,
      category: req.body.category,
      status: req.body.status,
      serviceProviderMappingId: req.body.serviceProviderMappingId,
    };

    const result = await BbpsService.listTransactions(payload, req.user);

    return res.json(
      ApiResponse.success(result, "Transactions fetched successfully")
    );
  });

  static listPendingBills = asyncHandler(async (req, res) => {
    const payload = {
      ...req.query, // GET params
      serviceProviderMappingId: req.query.serviceProviderMappingId,
    };

    const result = await BbpsService.listPendingBills(payload, req.user);

    return res.json(
      ApiResponse.success(result, "Pending bills fetched successfully")
    );
  });
}

export default BbpsController;
