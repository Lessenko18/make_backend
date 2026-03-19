import { Router } from "express";
import clientRouter from "./clientRoutes.js";
import categoryRouter from "./categoryRoutes.js";
import serviceRouter from "./serviceRoutes.js";
import appointmentRouter from "./appointmentRoutes.js";
import financeRouter from "./financeRoutes.js";
import authRouter from "./authRoutes.js";
import userRouter from "./userRoutes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "API funcionando" });
});

router.use("/clients", clientRouter);
router.use("/services", serviceRouter);
router.use("/categories", categoryRouter);
router.use("/appointments", appointmentRouter);
router.use("/finance", financeRouter);
router.use("/auth", authRouter);
router.use("/users", userRouter);

export { router };
