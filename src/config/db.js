import mongoose from "mongoose";

let cachedConnection = null;
let cachedPromise = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI ou MONGODB_URI não foi configurada no ambiente");
  }

  if (cachedConnection || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
      })
      .then((mongooseInstance) => {
        cachedConnection = mongooseInstance.connection;
        console.log("MongoDB conectado com sucesso");
        return cachedConnection;
      })
      .catch((error) => {
        cachedPromise = null;
        throw error;
      });
  }

  return cachedPromise;
};

export default connectDB;
