import Client from "../models/Client.js";
import { getClientProcedureSnapshot } from "../services/appointmentService.js";
import { uploadBuffer, deleteByUrl } from "../config/cloudinary.js";

export const createClient = async (req, res) => {
  try {
    const client = await Client.create(req.body);
    return res.status(201).json(client);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const listClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    return res.json(clients);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Cliente não encontrado" });
    }

    const procedures = await getClientProcedureSnapshot(client._id);

    return res.json({
      ...client.toObject(),
      procedures,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!client) {
      return res.status(404).json({ message: "Cliente não encontrado" });
    }

    return res.json(client);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).json({ message: "Cliente não encontrado" });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhuma imagem enviada." });
    }

    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Cliente não encontrado" });
    }

    if (client.profilePhoto) {
      await deleteByUrl(client.profilePhoto);
    }

    const result = await uploadBuffer(req.file.buffer, req.file.mimetype);
    client.profilePhoto = result.secure_url;
    await client.save();

    return res.json({ profilePhoto: client.profilePhoto });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const uploadGalleryPhotos = async (req, res) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ message: "Nenhuma imagem enviada." });
    }

    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Cliente não encontrado" });
    }

    const uploads = await Promise.all(
      req.files.map((f) => uploadBuffer(f.buffer, f.mimetype)),
    );
    client.photos.push(...uploads.map((r) => r.secure_url));
    await client.save();

    return res.json({ photos: client.photos });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteGalleryPhoto = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL da foto é obrigatória." });
    }

    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Cliente não encontrado" });
    }

    client.photos = client.photos.filter((p) => p !== url);
    await client.save();
    await deleteByUrl(url);

    return res.json({ photos: client.photos });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
