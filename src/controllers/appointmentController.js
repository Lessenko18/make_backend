import {
  createAppointment,
  listAppointments,
  updateAppointment,
} from "../services/appointmentService.js";

export const createAppointmentController = async (req, res) => {
  try {
    const appointment = await createAppointment(req.body);
    return res.status(201).json(appointment);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const listAppointmentsController = async (req, res) => {
  try {
    const appointments = await listAppointments();
    return res.json(appointments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateAppointmentController = async (req, res) => {
  try {
    const appointment = await updateAppointment(req.params.id, req.body);

    if (!appointment) {
      return res.status(404).json({ message: "Agendamento não encontrado" });
    }

    return res.json(appointment);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
