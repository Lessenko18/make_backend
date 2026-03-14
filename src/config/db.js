import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI ou MONGODB_URI não foi configurada no ambiente");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB conectado com sucesso");
};

export default connectDB;
