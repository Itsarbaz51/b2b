import ReportService from "../services/reports/report.service.js";

export default class ReportController {
  //  PROFIT BREAKDOWN
  static async getProfitBreakdown(req, res, next) {
    try {
      const { fromDate, toDate } = req.query;

      const data = await ReportService.getProfitBreakdown({
        userId: req.user.id,
        role: req.user.role,
        fromDate,
        toDate,
      });

      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  //  CA REPORT
  static async getCAReport(req, res, next) {
    try {
      const { fromDate, toDate } = req.query;

      const data = await ReportService.getCAReport({
        fromDate,
        toDate,
      });

      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}
