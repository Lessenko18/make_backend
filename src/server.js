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
app.get("/", (req, res) => {
  res.json({ message: "Backend online" });
});
app.use("/api", router);
app.use("/", router);
app.use(express.static("public"));

connectDB().catch((error) => {
  console.error("Erro ao conectar ao banco:", {
    name: error?.name,
    message: error?.message,
    code: error?.code,
  });
});

// Roda localmente; no Vercel o próprio servidor gerencia a porta
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

export default app;
