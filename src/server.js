import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./routes/index.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api", router);
app.use(express.static("public"));

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Servidor backend rodando na porta ${port}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar servidor:", {
      name: error?.name,
      message: error?.message,
      code: error?.code,
    });
    process.exit(1);
  }
};

startServer();
