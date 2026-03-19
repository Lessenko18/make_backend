import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || null,
});

const issueToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado no ambiente");
  }

  return jwt.sign({ sub: user._id, email: user.email }, secret, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const comparePassword = async (plainPassword, userPassword) => {
  if (!userPassword) return false;

  // Compatibilidade: permite login em contas legadas com senha salva sem hash.
  if (!userPassword.startsWith("$2")) {
    return plainPassword === userPassword;
  }

  return bcrypt.compare(plainPassword, userPassword);
};

export const register = async ({ name, email, password }) => {
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();
  const exists = await User.findOne({ email: normalizedEmail }).lean();

  if (exists) {
    const error = new Error("Já existe uma conta com este e-mail");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: String(name || "").trim(),
    email: normalizedEmail,
    password: hashedPassword,
  });

  return {
    token: issueToken(user),
    user: sanitizeUser(user),
  };
};

export const login = async ({ email, password }) => {
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error("E-mail ou senha inválidos");
    error.statusCode = 401;
    throw error;
  }

  const validPassword = await comparePassword(password, user.password);
  if (!validPassword) {
    const error = new Error("E-mail ou senha inválidos");
    error.statusCode = 401;
    throw error;
  }

  return {
    token: issueToken(user),
    user: sanitizeUser(user),
  };
};

export const forgotPassword = async ({ email }) => {
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();
  const user = await User.findOne({ email: normalizedEmail });

  // Resposta neutra para não vazar se o e-mail existe.
  if (!user) {
    return {
      message: "Se o e-mail existir, enviaremos as instruções de recuperação.",
    };
  }

  const resetToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  return {
    message: "Se o e-mail existir, enviaremos as instruções de recuperação.",
    // Ambiente de desenvolvimento: útil até integrar envio real de e-mail.
    resetToken,
  };
};
