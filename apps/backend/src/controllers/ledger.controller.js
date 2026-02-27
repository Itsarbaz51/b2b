import asyncHandler from "../utils/AsyncHandler.js";

class LedgerController {
  static index = asyncHandler(async (req, res) => { });
  static show = asyncHandler(async (req, res) => { });
  static store = asyncHandler(async (req, res) => { });
  static update = asyncHandler(async (req, res) => { });
  static destroy = asyncHandler(async (req, res) => { });
}

export default LedgerController;
