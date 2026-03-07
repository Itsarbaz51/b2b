import asyncHandler from "../../utils/AsyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import PanService from "../../services/pan/pan.service.js";

class PanController {
  static verify = asyncHandler(async (req, res) => {
    const result = await PanService.verifyPan(req.body, req.user);

    res
      .status(200)
      .json(ApiResponse.success(result, "PAN verified successfully", 200));
  });
}

export { PanController };
