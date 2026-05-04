import multer from "multer";

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

const memoryStorage = multer.memoryStorage();

export const uploadSingle = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("photo");

export const uploadMultiple = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("photos", 10);
