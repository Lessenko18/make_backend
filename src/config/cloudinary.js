import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadBuffer = (buffer, mimetype, folder = "makeupmeurer") => {
  const dataUri = `data:${mimetype};base64,${buffer.toString("base64")}`;
  return cloudinary.uploader.upload(dataUri, { folder });
};

export const deleteByUrl = (url) => {
  try {
    const parts = url.split("/");
    const filename = parts[parts.length - 1].split(".")[0];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${filename}`;
    return cloudinary.uploader.destroy(publicId);
  } catch {
    return Promise.resolve();
  }
};
