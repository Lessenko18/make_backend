import Category from "../models/Category.js";

export const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    return res.status(201).json(category);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const listCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ message: "Categoria não encontrada" });
    }

    return res.json(category);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
