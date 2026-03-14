import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    profilePhoto: {
      type: String,
    },
    photos: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
    },
  },
  { timestamps: true },
);

clientSchema.index({ name: 1 });
clientSchema.index({ phone: 1 });

const Client = mongoose.model("Client", clientSchema);

export default Client;
