import WalletService from "../services/wallet.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export default class WalletController {
  static async transferCommissionToPrimary(req, res) {
    const userId = req.user.id;

    const result = await WalletService.transferCommissionToPrimary(
      req.body,
      userId
    );

    return res
      .status(201)
      .json(ApiResponse.success(result, "Transfer successful", 201));
  }
}
