import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["agendado", "concluido", "pago", "cancelado"],
      default: "agendado",
    },
    paymentMethod: {
      type: String,
      enum: [
        "dinheiro",
        "pix",
        "cartao_credito",
        "cartao_debito",
        "transferencia",
        "outro",
      ],
    },
    notes: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
    isFinancePosted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

appointmentSchema.index({ client: 1, scheduledAt: -1 });
appointmentSchema.index({ status: 1, scheduledAt: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
