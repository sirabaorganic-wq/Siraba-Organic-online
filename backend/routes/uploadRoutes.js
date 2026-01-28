const express = require("express");
const router = express.Router();
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const { uploadPdfToR2 } = require("../config/r2");
const { uploadImageToImageKit } = require("../config/imagekit");

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
]);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      return cb(null, true);
    }
    cb(
      new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Unsupported file type"),
    );
  },
});

// @route POST /api/upload
// @desc  Uploads file to R2 (PDFs) or ImageKit (Images)
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const fileType = req.file.mimetype;
    const isPdf = fileType === "application/pdf";
    const isImage = fileType.startsWith("image/");

    // Validate upload service is configured
    if (isPdf) {
      if (
        !process.env.R2_ACCESS_KEY_ID ||
        !process.env.R2_SECRET_ACCESS_KEY ||
        !process.env.R2_BUCKET_NAME
      ) {
        console.error("R2 not properly configured");
        return res
          .status(500)
          .json({ message: "PDF upload service not configured" });
      }
    } else if (isImage) {
      if (
        !process.env.IMAGEKIT_PUBLIC_KEY ||
        !process.env.IMAGEKIT_PRIVATE_KEY
      ) {
        console.error("ImageKit not properly configured");
        return res
          .status(500)
          .json({ message: "Image upload service not configured" });
      }
    }

    const folder = req.body.folder || "uploads";
    const baseName =
      req.body.publicId || path.parse(req.file.originalname).name;
    const uniqueId = crypto.randomBytes(6).toString("hex");
    const fileName =
      `${folder}/${baseName}-${uniqueId}${path.extname(req.file.originalname)}`.replace(
        /[^a-zA-Z0-9-_\/\.]/g,
        "",
      );

    try {
      let url, metadata;

      if (isPdf) {
        // Upload to R2
        url = await uploadPdfToR2(fileName, req.file.buffer, fileType);
        metadata = {
          url,
          fileName: req.file.originalname,
          fileType: "pdf",
          size: req.file.size,
          service: "R2",
        };
      } else if (isImage) {
        // Upload to ImageKit
        const result = await uploadImageToImageKit(
          req.file.originalname,
          req.file.buffer,
        );
        url = result.url;
        metadata = {
          url,
          fileName: result.name,
          fileId: result.fileId,
          fileType: "image",
          size: req.file.size,
          service: "ImageKit",
        };
      }

      return res.status(201).json({
        url,
        ...metadata,
        download_url: url,
      });
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      return res.status(500).json({ message: "Error uploading file" });
    }
  } catch (error) {
    console.error("Upload endpoint error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route GET /api/upload/:filename
// @desc  Previously served files from GridFS. Now direct URLs are returned on upload.
router.get("/:filename", (req, res) => {
  return res.status(410).json({
    message:
      "Direct file retrieval is now handled via Cloudinary URLs returned at upload time.",
  });
});

// Handle multer errors cleanly (must be after routes)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File too large. Max 5MB allowed." });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "Unsupported file type. Allowed: PDF, JPG, PNG, WEBP.",
      });
    }
    return res.status(400).json({ message: err.message });
  }
  return next(err);
});

module.exports = router;
