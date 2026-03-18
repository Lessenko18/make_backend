import Service from "../models/Service.js";

export const createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    return res.status(201).json(service);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const listServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    return res.json(services);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      return res.status(404).json({ message: "Serviço não encontrado" });
    }

    return res.json(service);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Serviço não encontrado" });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
