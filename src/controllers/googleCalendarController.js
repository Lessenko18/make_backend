import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  exchangeCodeForTokens,
  getAuthUrl,
} from "../services/googleCalendarService.js";

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const getConnectUrl = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token necessário" });
    }

    const token = authHeader.slice(7);
    verifyToken(token);

    const url = getAuthUrl();
    const urlWithState = `${url}&state=${encodeURIComponent(token)}`;
    return res.json({ url: urlWithState });
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
};

export const handleCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/agenda?google_calendar=error`);
    }

    const decoded = verifyToken(decodeURIComponent(state));
    const user = await User.findById(decoded.id || decoded._id || decoded.userId);

    if (!user) {
      return res.redirect(`${frontendUrl}/agenda?google_calendar=error`);
    }

    const tokens = await exchangeCodeForTokens(code);

    user.googleCalendar = {
      connected: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || user.googleCalendar?.refreshToken,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    };

    await user.save();

    return res.redirect(`${frontendUrl}/agenda?google_calendar=connected`);
  } catch (err) {
    console.error("Google Calendar callback error:", err.message);
    return res.redirect(`${frontendUrl}/agenda?google_calendar=error`);
  }
};

export const getStatus = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token necessário" });
    }

    const decoded = verifyToken(authHeader.slice(7));
    const user = await User.findById(decoded.id || decoded._id || decoded.userId).select(
      "googleCalendar",
    );

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    return res.json({ connected: user.googleCalendar?.connected ?? false });
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
};

export const disconnect = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token necessário" });
    }

    const decoded = verifyToken(authHeader.slice(7));
    const user = await User.findById(decoded.id || decoded._id || decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    user.googleCalendar = { connected: false };
    await user.save();

    return res.json({ message: "Google Calendar desconectado" });
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
};
