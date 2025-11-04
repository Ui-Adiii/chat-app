import { v2 as cloudinary } from "cloudinary";

const cloudinaryUpload = async (file) => {
  const resource_type = file.mimetype.startsWith("video") ? "video" : "image";

  const result = file.mimetype.startsWith("video")
    ? await cloudinary.uploader.upload_large(file.path, { resource_type })
    : await cloudinary.uploader.upload(file.path, {resource_type});
    return result?.secure_url;
};
export default cloudinaryUpload;
