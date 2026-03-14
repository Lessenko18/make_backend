import Appointment from "../models/Appointment.js";
import Category from "../models/Category.js";
import { syncFinanceFromAppointment } from "./financeService.js";

const FINANCE_ELIGIBLE_STATUS = ["concluido", "pago"];

const resolvePrice = async ({ categoryId, price }) => {
  if (typeof price === "number") {
    return price;
  }

  const category = await Category.findById(categoryId).select("valor").lean();
  if (!category) {
    throw new Error("Categoria não encontrada");
  }

  return category.valor;
};

const applyCompletedAt = ({ status, completedAt }) => {
  if (completedAt) {
    return completedAt;
  }

  if (FINANCE_ELIGIBLE_STATUS.includes(status)) {
    return new Date();
  }

  return undefined;
};

export const createAppointment = async (payload) => {
  const price = await resolvePrice({
    categoryId: payload.category,
    price: payload.price,
  });

  const appointment = await Appointment.create({
    ...payload,
    price,
    completedAt: applyCompletedAt({
      status: payload.status,
      completedAt: payload.completedAt,
    }),
  });

  await syncFinanceFromAppointment(appointment);

  return appointment;
};

export const updateAppointment = async (id, payload) => {
  const current = await Appointment.findById(id);
  if (!current) {
    return null;
  }

  const nextCategory = payload.category || current.category;
  const nextPrice = await resolvePrice({
    categoryId: nextCategory,
    price: payload.price,
  });
  const nextStatus = payload.status || current.status;

  current.client = payload.client || current.client;
  current.category = nextCategory;
  current.scheduledAt = payload.scheduledAt || current.scheduledAt;
  current.price = nextPrice;
  current.status = nextStatus;
  current.paymentMethod = payload.paymentMethod || current.paymentMethod;
  current.notes = payload.notes || current.notes;

  if (payload.completedAt || FINANCE_ELIGIBLE_STATUS.includes(nextStatus)) {
    current.completedAt = applyCompletedAt({
      status: nextStatus,
      completedAt: payload.completedAt || current.completedAt,
    });
  }

  await current.save();
  await syncFinanceFromAppointment(current);

  return current;
};

export const listAppointments = async () => {
  return Appointment.find()
    .populate("client", "name phone profilePhoto")
    .populate("category", "name valor")
    .sort({ scheduledAt: 1 });
};

export const getClientProcedureSnapshot = async (clientId) => {
  const now = new Date();

  const [lastProcedure, nextProcedure] = await Promise.all([
    Appointment.findOne({
      client: clientId,
      status: { $in: ["concluido", "pago"] },
      scheduledAt: { $lte: now },
    })
      .sort({ scheduledAt: -1 })
      .populate("category", "name valor")
      .lean(),
    Appointment.findOne({
      client: clientId,
      status: "agendado",
      scheduledAt: { $gte: now },
    })
      .sort({ scheduledAt: 1 })
      .populate("category", "name valor")
      .lean(),
  ]);

  return { lastProcedure, nextProcedure };
};
