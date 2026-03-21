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

app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Backend online" });
});
app.use("/api", router);
app.use("/", router);
app.use(express.static("public"));

app.use((error, _req, res, _next) => {
  console.error("Erro no servidor:", {
    name: error?.name,
    message: error?.message,
    code: error?.code,
  });

  if (error?.name === "MongoServerSelectionError") {
    return res.status(503).json({
      message: "Banco indisponivel no momento. Tente novamente em instantes.",
    });
  }

  return res.status(500).json({ message: error?.message || "Erro interno" });
});

// Roda localmente; no Vercel o próprio servidor gerencia a porta
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

export default app;
