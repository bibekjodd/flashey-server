import cloudinary from "cloudinary";

export const configureCloudinary = () => {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

export const uploadProfilePicture = async (
  datauri?: string
): Promise<{ public_id?: string; url?: string }> => {
  if (!datauri) return {};

  try {
    const { public_id, secure_url } = await cloudinary.v2.uploader.upload(
      datauri,
      { folder: "RealtimeChatApi" }
    );

    return { public_id, url: secure_url };
  } catch (err) {
    return {};
  }
};
