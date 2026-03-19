import bcrypt from "bcryptjs";
import User from "../models/User.js";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || null,
  resetPasswordToken: user.resetPasswordToken || null,
  resetPasswordExpires: user.resetPasswordExpires || null,
});

export const listUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ name: 1 });
    return res.json(users.map(sanitizeUser));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Nome, e-mail e senha são obrigatórios" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res
        .status(409)
        .json({ message: "Já existe usuário com este e-mail" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json(sanitizeUser(user));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, avatar } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    if (email) {
      const normalizedEmail = String(email).toLowerCase().trim();
      const duplicated = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      }).lean();

      if (duplicated) {
        return res
          .status(409)
          .json({ message: "Já existe usuário com este e-mail" });
      }

      user.email = normalizedEmail;
    }

    if (name) user.name = String(name).trim();
    if (typeof avatar === "string") user.avatar = avatar;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    return res.json(sanitizeUser(user));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
