import { Router } from "express";
import {
  createClient,
  deleteClient,
  deleteGalleryPhoto,
  getClientById,
  listClients,
  updateClient,
  uploadGalleryPhotos,
  uploadProfilePhoto,
} from "../controllers/clientController.js";
import {
  uploadMultiple,
  uploadSingle,
} from "../middlewares/uploadMiddleware.js";

const clientRouter = Router();

clientRouter.post("/", createClient);
clientRouter.get("/", listClients);
clientRouter.get("/:id", getClientById);
clientRouter.patch("/:id", updateClient);
clientRouter.delete("/:id", deleteClient);

clientRouter.patch("/:id/profile-photo", uploadSingle, uploadProfilePhoto);
clientRouter.post("/:id/photos", uploadMultiple, uploadGalleryPhotos);
clientRouter.delete("/:id/photos", deleteGalleryPhoto);

export default clientRouter;
