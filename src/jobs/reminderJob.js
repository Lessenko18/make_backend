import cron from "node-cron";
import Appointment from "../models/Appointment.js";
import { sendWhatsApp } from "../services/whatsappService.js";

const formatDateTime = (date) =>
  new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);

export const startReminderJob = () => {
  // Roda todo dia às 9h (horário de Brasília)
  cron.schedule(
    "0 9 * * *",
    async () => {
      const now = new Date();

      const tomorrowStart = new Date(now);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setHours(23, 59, 59, 999);

      console.log("[Lembrete] Buscando agendamentos para amanhã...");

      const appointments = await Appointment.find({
        status: "agendado",
        scheduledAt: { $gte: tomorrowStart, $lte: tomorrowEnd },
      })
        .populate("client", "name phone")
        .lean()
        .catch((e) => {
          console.error("[Lembrete] Erro ao buscar agendamentos:", e.message);
          return [];
        });

      for (const ap of appointments) {
        if (!ap.client?.phone) continue;

        const dateStr = formatDateTime(ap.scheduledAt);
        const msg =
          `Oiie, bom dia, tudo bem? 😊\n\n` +
          `Passando para lembrar do seu horário para amanhã às *${dateStr}*. Posso contar com a sua presença? ❤️`;

        await sendWhatsApp(ap.client.phone, msg);
      }

      console.log(`[Lembrete] ${appointments.length} lembrete(s) enviado(s)`);
    },
    { timezone: "America/Sao_Paulo" },
  );

  console.log("[Lembrete] Job diário ativado — roda às 9h todos os dias");
};
