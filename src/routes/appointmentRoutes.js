import { Router } from "express";
import {
  createAppointmentController,
  listAppointmentsController,
  updateAppointmentController,
  deleteAppointmentController,
  getClientHistoryController,
} from "../controllers/appointmentController.js";

const appointmentRouter = Router();

appointmentRouter.get("/", listAppointmentsController);
appointmentRouter.post("/", createAppointmentController);
appointmentRouter.get("/client/:clientId/history", getClientHistoryController);
appointmentRouter.patch("/:id", updateAppointmentController);
appointmentRouter.delete("/:id", deleteAppointmentController);

export default appointmentRouter;
