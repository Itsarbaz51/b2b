import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import BeneficiaryService from "../services/beneficiary.service.js";

class BeneficiaryController {
  static list = asyncHandler(async (req, res) => {
    const actor = req.user;

    const data = await BeneficiaryService.list({
      userId: actor.id,
      mobile: req.query.mobile,
    });

    return res
      .status(200)
      .json(
        ApiResponse.success(data, "Beneficiaries fetched successfully", 200)
      );
  });
}

export default BeneficiaryController;
