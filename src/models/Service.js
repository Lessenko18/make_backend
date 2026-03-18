import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    valor: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true, collection: "categories" },
);

const Service = mongoose.model("Service", serviceSchema);

export default Service;
