import { Router } from "express";
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from "../controllers/serviceController.js";

const serviceRouter = Router();

serviceRouter.post("/", createService);
serviceRouter.get("/", listServices);
serviceRouter.patch("/:id", updateService);
serviceRouter.delete("/:id", deleteService);

export default serviceRouter;
