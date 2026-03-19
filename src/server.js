import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./routes/index.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api", router);
app.use(express.static("public"));

connectDB().catch((error) => {
  console.error("Erro ao conectar ao banco:", {
    name: error?.name,
    message: error?.message,
    code: error?.code,
  });
});

export default app;
