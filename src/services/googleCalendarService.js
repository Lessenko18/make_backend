import { google } from "googleapis";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";

const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
};

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

export const getAuthUrl = () => {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
};

export const exchangeCodeForTokens = async (code) => {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

const buildAuthenticatedClient = (tokens, userId) => {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(tokens);

  oauth2Client.on("tokens", async (newTokens) => {
    const update = { "googleCalendar.accessToken": newTokens.access_token };
    if (newTokens.expiry_date) {
      update["googleCalendar.tokenExpiry"] = new Date(newTokens.expiry_date);
    }
    if (newTokens.refresh_token) {
      update["googleCalendar.refreshToken"] = newTokens.refresh_token;
    }
    await User.findByIdAndUpdate(userId, update);
  });

  return oauth2Client;
};

const buildEvent = (appointment) => {
  const start = new Date(appointment.scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const clientName = appointment.client?.name || "Cliente";
  const serviceName = appointment.category?.name || "Serviço";

  return {
    summary: `${serviceName} - ${clientName}`,
    description: appointment.notes || "",
    start: { dateTime: start.toISOString(), timeZone: "America/Sao_Paulo" },
    end: { dateTime: end.toISOString(), timeZone: "America/Sao_Paulo" },
  };
};

const getUsersWithCalendar = async () => {
  return User.find({ "googleCalendar.connected": true }).select(
    "_id googleCalendar",
  );
};

export const syncAppointmentCreate = async (appointment) => {
  if (!process.env.GOOGLE_CLIENT_ID) return;

  const users = await getUsersWithCalendar();
  if (!users.length) return;

  const user = users[0];
  const tokens = {
    access_token: user.googleCalendar.accessToken,
    refresh_token: user.googleCalendar.refreshToken,
    expiry_date: user.googleCalendar.tokenExpiry?.getTime(),
  };

  const auth = buildAuthenticatedClient(tokens, user._id);
  const calendar = google.calendar({ version: "v3", auth });

  const populated = await Appointment.findById(appointment._id)
    .populate("client", "name")
    .populate("category", "name")
    .lean();

  const { data } = await calendar.events.insert({
    calendarId: "primary",
    resource: buildEvent(populated),
  });

  await Appointment.findByIdAndUpdate(appointment._id, {
    googleEventId: data.id,
  });
};

export const syncAppointmentUpdate = async (appointment) => {
  if (!process.env.GOOGLE_CLIENT_ID || !appointment.googleEventId) return;

  const users = await getUsersWithCalendar();
  if (!users.length) return;

  const user = users[0];
  const tokens = {
    access_token: user.googleCalendar.accessToken,
    refresh_token: user.googleCalendar.refreshToken,
    expiry_date: user.googleCalendar.tokenExpiry?.getTime(),
  };

  const auth = buildAuthenticatedClient(tokens, user._id);
  const calendar = google.calendar({ version: "v3", auth });

  const populated = await Appointment.findById(appointment._id)
    .populate("client", "name")
    .populate("category", "name")
    .lean();

  await calendar.events.update({
    calendarId: "primary",
    eventId: appointment.googleEventId,
    resource: buildEvent(populated),
  });
};

export const syncAppointmentDelete = async (appointment) => {
  if (!process.env.GOOGLE_CLIENT_ID || !appointment?.googleEventId) return;

  const users = await getUsersWithCalendar();
  if (!users.length) return;

  const user = users[0];
  const tokens = {
    access_token: user.googleCalendar.accessToken,
    refresh_token: user.googleCalendar.refreshToken,
    expiry_date: user.googleCalendar.tokenExpiry?.getTime(),
  };

  const auth = buildAuthenticatedClient(tokens, user._id);
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: "primary",
    eventId: appointment.googleEventId,
  });
};
