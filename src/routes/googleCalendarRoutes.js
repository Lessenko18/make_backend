import { Router } from "express";
import {
  disconnect,
  getConnectUrl,
  getStatus,
  handleCallback,
} from "../controllers/googleCalendarController.js";

const googleCalendarRouter = Router();

googleCalendarRouter.get("/connect-url", getConnectUrl);
googleCalendarRouter.get("/callback", handleCallback);
googleCalendarRouter.get("/status", getStatus);
googleCalendarRouter.post("/disconnect", disconnect);

export default googleCalendarRouter;
