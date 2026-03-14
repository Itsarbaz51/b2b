import TransactionService from "../services/transaction.service.js";

export class TransactionController {
  static async getTransactions(req, res, next) {
    try {
      const data = await TransactionService.getTransactions({
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        type: req.query.type,
        search: req.query.search,
        date: req.query.date,
        role: req.user.role == "ADMIN" ? "ADMIN" : req.user.roleType,
        userId: req.user.id,
      });

      res.status(200).json({
        success: true,
        message: "Transactions fetched successfully",
        ...data,
      });
    } catch (err) {
      next(err);
    }
  }
}
