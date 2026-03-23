import {
  createManualExpense,
  listFinanceEntries,
} from "../services/financeService.js";

export const listFinanceEntriesController = async (req, res) => {
  try {
    const entries = await listFinanceEntries(req.query);
    return res.json(entries);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createManualExpenseController = async (req, res) => {
  try {
    const entry = await createManualExpense(req.body);
    return res.status(201).json(entry);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
