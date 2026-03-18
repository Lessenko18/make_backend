import {
  createAppointment,
  listAppointments,
  updateAppointment,
  deleteAppointment,
  getClientProcedureSnapshot,
  checkOverlappingAppointments,
} from "../services/appointmentService.js";

export const createAppointmentController = async (req, res) => {
  try {
    const {
      client,
      service,
      category,
      scheduledAt,
      price,
      notes,
      paymentMethod,
    } = req.body;

    if (!client) {
      return res.status(400).json({ message: "Cliente é obrigatório" });
    }

    if (!scheduledAt) {
      return res.status(400).json({ message: "Data e hora são obrigatórias" });
    }

    if (!service && !category) {
      return res.status(400).json({ message: "Serviço é obrigatório" });
    }

    const appointmentDate = new Date(scheduledAt);
    if (appointmentDate < new Date()) {
      return res
        .status(400)
        .json({ message: "Não é possível agendar para datas passadas" });
    }

    const hasOverlap = await checkOverlappingAppointments(client, scheduledAt);
    if (hasOverlap) {
      return res.status(409).json({
        message: "Cliente já possui agendamento no horário selecionado",
      });
    }

    const appointment = await createAppointment({
      client,
      service: service || category,
      scheduledAt,
      price,
      notes,
      paymentMethod,
    });

    return res.status(201).json({
      success: true,
      message: "Agendamento criado com sucesso",
      data: appointment,
    });
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return res.status(400).json({
      message: error.message || "Erro ao criar agendamento",
    });
  }
};

export const listAppointmentsController = async (req, res) => {
  try {
    const appointments = await listAppointments();
    const mapped = appointments.map((appointment) => {
      const data = appointment.toObject ? appointment.toObject() : appointment;
      return {
        ...data,
        service: data.category,
      };
    });

    return res.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error("Erro ao listar agendamentos:", error);
    return res.status(500).json({
      message: error.message || "Erro ao listar agendamentos",
    });
  }
};

export const updateAppointmentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, notes, scheduledAt } = req.body;

    if (
      status &&
      !["agendado", "concluido", "pago", "cancelado"].includes(status)
    ) {
      return res.status(400).json({
        message: "Status inválido. Use: agendado, concluido, pago ou cancelado",
      });
    }

    const appointment = await updateAppointment(id, {
      status,
      paymentMethod,
      notes,
      scheduledAt,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Agendamento não encontrado" });
    }

    return res.json({
      success: true,
      message: "Agendamento atualizado com sucesso",
      data: appointment,
    });
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    return res.status(400).json({
      message: error.message || "Erro ao atualizar agendamento",
    });
  }
};

export const deleteAppointmentController = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await deleteAppointment(id);

    if (!appointment) {
      return res.status(404).json({ message: "Agendamento não encontrado" });
    }

    return res.json({
      success: true,
      message: "Agendamento deletado com sucesso",
      data: appointment,
    });
  } catch (error) {
    console.error("Erro ao deletar agendamento:", error);
    return res.status(400).json({
      message: error.message || "Erro ao deletar agendamento",
    });
  }
};

export const getClientHistoryController = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ message: "ID do cliente é obrigatório" });
    }

    const snapshot = await getClientProcedureSnapshot(clientId);

    return res.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error("Erro ao obter histórico do cliente:", error);
    return res.status(400).json({
      message: error.message || "Erro ao obter histórico do cliente",
    });
  }
};
