import ReportService from "../services/reports/report.service.js";
import SettlementReportService from "../services/reports/settlement.report.service.js";
import CommissionReportService from "../services/reports/commission.report.service.js";

export default class ReportController {
  static async getTransactions(req, res, next) {
    try {
      const result = await ReportService.getTransactionReport({
        userId: req.user.id,
        role: req.user.role === "ADMIN" ? "ADMIN" : req.user.roleType,
        filters: req.query,
      });

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async exportCSV(req, res, next) {
    try {
      const csv = await ReportService.exportCSV({
        userId: req.user.id,
        role: req.user.role === "ADMIN" ? "ADMIN" : req.user.roleType,
        filters: req.query,
      });

      res.header("Content-Type", "text/csv");
      res.attachment("report.csv");
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }

  static async getSettlements(req, res, next) {
    try {
      const result = await SettlementReportService.getSettlementReport({
        userId: req.user.id,
        role: req.user.role === "ADMIN" ? "ADMIN" : req.user.roleType,
        filters: req.query,
      });

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getCommissions(req, res, next) {
    try {
      const result = await CommissionReportService.getCommissionReport({
        userId: req.user.id,
        role: req.user.role === "ADMIN" ? "ADMIN" : req.user.roleType,
        filters: req.query,
      });

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}
