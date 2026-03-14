import { Router } from "express";
import {
  createAppointmentController,
  listAppointmentsController,
  updateAppointmentController,
} from "../controllers/appointmentController.js";

const appointmentRouter = Router();

appointmentRouter.post("/", createAppointmentController);
appointmentRouter.get("/", listAppointmentsController);
appointmentRouter.patch("/:id", updateAppointmentController);

export default appointmentRouter;
