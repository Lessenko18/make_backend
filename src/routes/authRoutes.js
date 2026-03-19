import { Router } from "express";
import {
  forgotPasswordRequest,
  loginUser,
  registerUser,
} from "../controllers/authController.js";

const authRouter = Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/forgot-password", forgotPasswordRequest);

export default authRouter;
