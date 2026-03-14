import mongoose from "mongoose";

const financeEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["entrada", "saida"],
      required: true,
    },
    origin: {
      type: String,
      enum: ["agendamento", "compra_manual", "ajuste"],
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      unique: true,
      sparse: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
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
    status: {
      type: String,
      enum: ["pendente", "pago"],
      default: "pago",
    },
    description: {
      type: String,
      validate: {
        validator: function (value) {
          if (this.type === "saida" && this.origin === "compra_manual") {
            return Boolean(value && value.trim());
          }
          return true;
        },
        message: "Descrição é obrigatória para saída manual (compra).",
      },
    },
    notes: {
      type: String,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

financeEntrySchema.index({ type: 1, paidAt: -1 });
financeEntrySchema.index({ origin: 1, createdAt: -1 });

const FinanceEntry = mongoose.model("FinanceEntry", financeEntrySchema);

export default FinanceEntry;
