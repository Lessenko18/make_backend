import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    const hash = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${hash}${ext}`);
  },
});

const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const fileFilter = (_req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Apenas imagens são permitidas (jpeg, png, webp, gif)."),
      false,
    );
  }
};

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single("photo");

export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("photos", 10);
