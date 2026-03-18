import Appointment from "../models/Appointment.js";
import Service from "../models/Service.js";
import { syncFinanceFromAppointment } from "./financeService.js";

const FINANCE_ELIGIBLE_STATUS = ["concluido", "pago"];

const resolveServiceId = (payload, current) => {
  return payload.service || payload.category || current?.category;
};

const resolvePrice = async ({ categoryId, price }) => {
  if (typeof price === "number") {
    return price;
  }

  const service = await Service.findById(categoryId).select("valor").lean();
  if (!service) {
    throw new Error("Serviço não encontrado");
  }

  return service.valor;
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
  const serviceId = resolveServiceId(payload);

  if (!serviceId) {
    throw new Error("Serviço é obrigatório");
  }

  const price = await resolvePrice({
    categoryId: serviceId,
    price: payload.price,
  });

  const appointment = await Appointment.create({
    ...payload,
    category: serviceId,
    price,
    completedAt: applyCompletedAt({
      status: payload.status,
      completedAt: payload.completedAt,
    }),
  });

  await syncFinanceFromAppointment(appointment);

  return appointment;
};

/**
 * Verificar se existe agendamento sobreposto para o mesmo cliente
 * Considera uma margem de 1 hora entre agendamentos
 */
export const checkOverlappingAppointments = async (clientId, scheduledAt) => {
  const appointmentDate = new Date(scheduledAt);
  const oneHourBefore = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
  const oneHourAfter = new Date(appointmentDate.getTime() + 60 * 60 * 1000);

  const overlapping = await Appointment.findOne({
    client: clientId,
    status: { $in: ["agendado", "concluido", "pago"] },
    scheduledAt: {
      $gte: oneHourBefore,
      $lte: oneHourAfter,
    },
  });

  return !!overlapping;
};

export const updateAppointment = async (id, payload) => {
  const current = await Appointment.findById(id);
  if (!current) {
    return null;
  }

  const nextCategory = resolveServiceId(payload, current);
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

/**
 * Deletar agendamento e remover entrada financeira associada
 */
export const deleteAppointment = async (id) => {
  const appointment = await Appointment.findByIdAndDelete(id);

  if (appointment) {
    const FinanceEntry = (await import("../models/FinanceEntry.js")).default;
    await FinanceEntry.deleteOne({ appointment: id });
  }

  return appointment;
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
