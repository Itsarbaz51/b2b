import LedgerService from "../services/ledger.service.js";

export default class LedgerController {
  static async getLedger(req, res) {
    const result = await LedgerService.getLedger({
      ...req.query,
      userId: req.user.id, // auth se
      role:
        req.user.role === "ADMIN"
          ? "ADMIN"
          : req.user.roleType == "employee" && "employee",
    });

    res.json({
      status: "success",
      ...result,
    });
  }
}
