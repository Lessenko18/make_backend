import { Router } from "express";
import {
  createManualExpenseController,
  listFinanceEntriesController,
} from "../controllers/financeController.js";

const financeRouter = Router();

financeRouter.get("/", listFinanceEntriesController);
financeRouter.post("/manual-expenses", createManualExpenseController);

export default financeRouter;
