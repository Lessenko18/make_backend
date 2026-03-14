import { Router } from "express";
import {
  createCategory,
  listCategories,
  updateCategory,
} from "../controllers/categoryController.js";

const categoryRouter = Router();

categoryRouter.post("/", createCategory);
categoryRouter.get("/", listCategories);
categoryRouter.patch("/:id", updateCategory);

export default categoryRouter;
