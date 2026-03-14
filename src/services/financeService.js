import FinanceEntry from "../models/FinanceEntry.js";

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

export const listFinanceEntries = async () => {
  return FinanceEntry.find()
    .populate("client", "name phone")
    .populate("category", "name valor")
    .sort({ paidAt: -1, createdAt: -1 });
};
