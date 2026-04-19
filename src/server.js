import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./routes/index.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
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

app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.path}`);
  next();
});

app.get("/", (req, res) => {
  res.json({ message: "Backend online" });
});
app.use("/api", router);
app.use("/", router);
app.use(express.static("public"));

app.use((req, res) => {
  console.log(`[404] Sem rota: ${req.method} ${req.path}`);
  res.status(404).json({ message: `Rota não encontrada: ${req.method} ${req.path}` });
});

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
