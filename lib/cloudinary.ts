import { v2 as cloudinary } from "cloudinary";

function ensureConfigured() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadImageBuffer(params: {
  buffer: Buffer;
  folder: string;
  publicId?: string;
}): Promise<{ secure_url: string; public_id: string }> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: params.folder,
        ...(params.publicId ? { public_id: params.publicId } : {}),
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else if (!result?.secure_url || !result.public_id) {
          reject(new Error("Cloudinary upload failed"));
        } else {
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      },
    );
    upload.end(params.buffer);
  });
}

export async function deleteCloudinaryAsset(publicId: string) {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
