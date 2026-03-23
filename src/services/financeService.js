import FinanceEntry from "../models/FinanceEntry.js";
import mongoose from "mongoose";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDateBoundary = (value, mode = "start") => {
  if (!value) return null;

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return null;

  if (mode === "start") {
    parsedDate.setHours(0, 0, 0, 0);
  } else {
    parsedDate.setHours(23, 59, 59, 999);
  }

  return parsedDate;
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const createManualExpense = async ({
  amount,
  paymentMethod,
  description,
  notes,
}) => {
  return FinanceEntry.create({
    type: "saida",
    origin: "compra_manual",
    amount,
    paymentMethod,
    description,
    notes,
    status: "pago",
    paidAt: new Date(),
  });
};

export const syncFinanceFromAppointment = async (appointmentDoc) => {
  const eligibleStatus = ["concluido", "pago"];

  if (!appointmentDoc) return;

  const isEligible = eligibleStatus.includes(appointmentDoc.status);

  if (!isEligible) {
    await FinanceEntry.deleteOne({ appointment: appointmentDoc._id });

    if (appointmentDoc.isFinancePosted) {
      appointmentDoc.isFinancePosted = false;
      await appointmentDoc.save();
    }
    return;
  }

  await FinanceEntry.findOneAndUpdate(
    { appointment: appointmentDoc._id },
    {
      type: "entrada",
      origin: "agendamento",
      appointment: appointmentDoc._id,
      client: appointmentDoc.client,
      category: appointmentDoc.category,
      amount: appointmentDoc.price,
      paymentMethod: appointmentDoc.paymentMethod,
      status: "pago",
      paidAt: appointmentDoc.completedAt || appointmentDoc.scheduledAt,
      notes: appointmentDoc.notes,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  if (!appointmentDoc.isFinancePosted) {
    appointmentDoc.isFinancePosted = true;
    await appointmentDoc.save();
  }
};

export const listFinanceEntries = async (filters = {}) => {
  const {
    date,
    dateFrom,
    dateTo,
    description,
    category,
    notes,
    paymentMethod,
    amount,
    amountMin,
    amountMax,
    type,
    client,
  } = filters;

  const query = {};

  if (type) {
    query.type = type;
  }

  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }

  const amountExact = parseNumber(amount);
  const minAmount = parseNumber(amountMin);
  const maxAmount = parseNumber(amountMax);

  if (amountExact !== null) {
    query.amount = amountExact;
  } else if (minAmount !== null || maxAmount !== null) {
    query.amount = {};
    if (minAmount !== null) query.amount.$gte = minAmount;
    if (maxAmount !== null) query.amount.$lte = maxAmount;
  }

  const dateRange = {};
  const exactStartDate = parseDateBoundary(date, "start");
  const exactEndDate = parseDateBoundary(date, "end");
  const startDate = parseDateBoundary(dateFrom, "start");
  const endDate = parseDateBoundary(dateTo, "end");

  if (exactStartDate && exactEndDate) {
    dateRange.$gte = exactStartDate;
    dateRange.$lte = exactEndDate;
  } else {
    if (startDate) dateRange.$gte = startDate;
    if (endDate) dateRange.$lte = endDate;
  }

  if (Object.keys(dateRange).length > 0) {
    query.paidAt = dateRange;
  }

  if (notes) {
    query.notes = { $regex: escapeRegex(notes), $options: "i" };
  }

  const hasCategoryFilter = Boolean(category && String(category).trim());
  const hasClientFilter = Boolean(client && String(client).trim());
  const categoryValue = String(category || "").trim();
  const clientValue = String(client || "").trim();

  if (hasCategoryFilter && mongoose.Types.ObjectId.isValid(categoryValue)) {
    query.category = categoryValue;
  }

  if (hasClientFilter && mongoose.Types.ObjectId.isValid(clientValue)) {
    query.client = clientValue;
  }

  let entries = await FinanceEntry.find(query)
    .populate("client", "name phone")
    .populate("category", "name valor")
    .sort({ paidAt: -1, createdAt: -1 });

  if (hasCategoryFilter && !mongoose.Types.ObjectId.isValid(categoryValue)) {
    const categoryTerm = normalizeText(categoryValue);
    entries = entries.filter((entry) =>
      normalizeText(entry.category?.name).includes(categoryTerm),
    );
  }

  if (hasClientFilter && !mongoose.Types.ObjectId.isValid(clientValue)) {
    const clientTerm = normalizeText(clientValue);
    entries = entries.filter((entry) =>
      normalizeText(entry.client?.name).includes(clientTerm),
    );
  }

  if (description) {
    const descriptionTerm = normalizeText(description);
    entries = entries.filter((entry) => {
      const manualDescription = normalizeText(entry.description);
      const composedDescription = normalizeText(
        [entry.client?.name, entry.category?.name].filter(Boolean).join(" - "),
      );

      return (
        manualDescription.includes(descriptionTerm) ||
        composedDescription.includes(descriptionTerm)
      );
    });
  }

  return entries.map((entry) => {
    const data = entry.toObject ? entry.toObject() : entry;
    return {
      ...data,
      service: data.category,
    };
  });
};
