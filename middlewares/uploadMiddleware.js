import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import ApiError from "../utils/apiError.js";

// Load environment variables
dotenv.config({ path: "config.env", quiet: true });

// ========================
// Cloudinary Configuration
// ========================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ========================
// Multer Memory Storage
// ========================
const memoryStorage = multer.memoryStorage();

// ========================
// File Filter
// ========================
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new ApiError("Only image files are allowed", 400));
  }
};

// ========================
// Multer Instance with Memory Storage
// ========================
const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
  fileFilter,
});

// ========================
// Check if File Already Processed
// ========================
const isFileAlreadyProcessed = (file) => {
  return file.processed && file.processed.url;
};

// ========================
// Upload File to Cloudinary from Memory Buffer
// ========================
const uploadToCloudinary = async (file, folder = "ERP") => {
  // Check if file already processed
  if (isFileAlreadyProcessed(file)) {
    return file.processed;
  }

  if (!file || !file.buffer) {
    throw new Error("Invalid file object");
  }

  try {
    const base64String = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      public_id: `${uuidv4()}-${Date.now()}`,
      resource_type: "auto",
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      size: result.bytes,
      originalName: file.originalname,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Cloudinary upload failed");
  }
};

// ========================
// Determine Folder
// ========================
const getFolderFromRequest = (req, fileFieldName = "") => {
  if (req.baseUrl) {
    if (req.baseUrl.includes("/products") || fileFieldName === "img") {
      return "ERP/products";
    } else if (req.baseUrl.includes("/users") || fileFieldName === "avatar") {
      return "ERP/users";
    } else if (req.baseUrl.includes("/categories")) {
      return "ERP/categories";
    }
  }

  if (fileFieldName === "img" || fileFieldName === "productImage") {
    return "ERP/products";
  } else if (fileFieldName === "avatar" || fileFieldName === "profileImage") {
    return "ERP/users";
  }

  return "ERP/general";
};

// ========================
// Process Upload Middleware
// ========================
export const processUpload = async (req, res, next) => {
  try {
    // Check if files already processed
    if (req._filesProcessed) {
      return next();
    }

    // Process single file
    if (req.file) {
      if (!isFileAlreadyProcessed(req.file)) {
        const folder = getFolderFromRequest(req, req.file.fieldname);
        req.file.processed = await uploadToCloudinary(req.file, folder);

        if (req.file.fieldname && req.file.processed) {
          req.body[req.file.fieldname] = req.file.processed.url;
        }
      }
    }

    // Process multiple files
    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files = await Promise.all(
          req.files.map(async (file) => {
            if (isFileAlreadyProcessed(file)) {
              return file;
            }

            const folder = getFolderFromRequest(req, file.fieldname);
            const processed = await uploadToCloudinary(file, folder);
            return {
              ...file,
              processed,
            };
          }),
        );

        if (req.files.length > 0 && req.files[0].fieldname) {
          req.body[req.files[0].fieldname] = req.files.map(
            (f) => f.processed?.url,
          );
        }
      } else {
        for (const fieldName of Object.keys(req.files)) {
          req.files[fieldName] = await Promise.all(
            req.files[fieldName].map(async (file) => {
              if (isFileAlreadyProcessed(file)) {
                return file;
              }

              const folder = getFolderFromRequest(req, file.fieldname);
              const processed = await uploadToCloudinary(file, folder);
              return {
                ...file,
                processed,
              };
            }),
          );

          req.body[fieldName] = req.files[fieldName].map(
            (f) => f.processed?.url,
          );
        }
      }
    }

    // Mark as processed
    req._filesProcessed = true;
    next();
  } catch (error) {
    console.error("Upload processing error:", error);
    next(new ApiError("Upload failed", 500));
  }
};

// ========================
// Delete from Cloudinary
// ========================
export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
};

// ========================
// Delete Uploaded File
// ========================
export const deleteUploadedFile = async (filePathOrUrl) => {
  try {
    // فقط Cloudinary URLs
    if (filePathOrUrl.includes("cloudinary.com")) {
      const urlParts = filePathOrUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const publicId = fileName.split(".")[0];

      // Extract folder from URL
      const uploadIndex = urlParts.indexOf("upload");
      if (uploadIndex > 0) {
        const folderParts = urlParts.slice(uploadIndex + 2, -1);
        if (folderParts.length > 0) {
          const fullPublicId = `${folderParts.join("/")}/${publicId}`;
          return await deleteFromCloudinary(fullPublicId);
        }
      }

      return await deleteFromCloudinary(publicId);
    }

    return true;
  } catch (error) {
    console.error("Delete uploaded file error:", error);
    return false;
  }
};

// ========================
// Extract Public ID
// ========================
export const extractPublicIdFromUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;

  try {
    const urlParts = url.split("/");
    const fileName = urlParts[urlParts.length - 1];
    const publicId = fileName.split(".")[0];

    const uploadIndex = urlParts.indexOf("upload");
    if (uploadIndex > 0) {
      const folderParts = urlParts.slice(uploadIndex + 2, -1);
      if (folderParts.length > 0) {
        return `${folderParts.join("/")}/${publicId}`;
      }
    }

    return publicId;
  } catch (error) {
    console.error("Extract public ID error:", error);
    return null;
  }
};

// ========================
// Middleware Combinations
// ========================

// Single file upload with processing
export const singleUpload = (fieldName) => (req, res, next) => {
  const multerMiddleware = upload.single(fieldName);

  multerMiddleware(req, res, (err) => {
    if (err) return next(err);
    processUpload(req, res, next);
  });
};

// Array upload with processing
export const arrayUpload =
  (fieldName, maxCount = 10) =>
  (req, res, next) => {
    const multerMiddleware = upload.array(fieldName, maxCount);

    multerMiddleware(req, res, (err) => {
      if (err) return next(err);
      processUpload(req, res, next);
    });
  };

// Fields upload with processing
export const fieldsUpload = (fields) => (req, res, next) => {
  const multerMiddleware = upload.fields(fields);

  multerMiddleware(req, res, (err) => {
    if (err) return next(err);
    processUpload(req, res, next);
  });
};

export default upload;
