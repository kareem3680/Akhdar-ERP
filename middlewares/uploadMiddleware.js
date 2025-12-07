import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import ApiError from "../utils/apiError.js";
import dotenv from "dotenv";

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
// Multer Disk Storage
// ========================
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = "temp_uploads/";
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// ========================
// File Filter
// ========================
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new ApiError("Only image files are allowed", 400));
  }
};

// ========================
// Multer Instance
// ========================
const upload = multer({
  storage: tempStorage,
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
// Upload File to Cloudinary
// ========================
const uploadToCloudinary = async (file, folder = "ERP") => {
  // Check if file already processed
  if (isFileAlreadyProcessed(file)) {
    return file.processed;
  }

  if (!file || !file.path) {
    throw new Error("Invalid file object");
  }

  if (!fs.existsSync(file.path)) {
    throw new Error("File not found");
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      public_id: `${uuidv4()}-${Date.now()}`,
      resource_type: "auto",
    });

    // Delete temp file
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (unlinkError) {
      // Silent fail for temp file deletion
    }

    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      size: result.bytes,
      originalName: file.originalname,
    };
  } catch (error) {
    // Clean up on error
    try {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (cleanupError) {
      // Silent fail for cleanup
    }

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
          })
        );

        if (req.files.length > 0 && req.files[0].fieldname) {
          req.body[req.files[0].fieldname] = req.files.map(
            (f) => f.processed?.url
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
            })
          );

          req.body[fieldName] = req.files[fieldName].map(
            (f) => f.processed?.url
          );
        }
      }
    }

    // Mark as processed
    req._filesProcessed = true;
    next();
  } catch (error) {
    // Cleanup any temp files
    const cleanupFiles = [];

    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      cleanupFiles.push(req.file.path);
    }

    if (req.files) {
      const allFiles = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat();
      allFiles.forEach((file) => {
        if (file && file.path && fs.existsSync(file.path)) {
          cleanupFiles.push(file.path);
        }
      });
    }

    cleanupFiles.forEach((filePath) => {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // Silent cleanup
      }
    });

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
    return false;
  }
};

// ========================
// Delete Uploaded File
// ========================
export const deleteUploadedFile = async (filePathOrUrl) => {
  try {
    // Local file
    if (filePathOrUrl.startsWith("temp_uploads/")) {
      if (fs.existsSync(filePathOrUrl)) {
        fs.unlinkSync(filePathOrUrl);
      }
      return true;
    }

    // Cloudinary URL
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
