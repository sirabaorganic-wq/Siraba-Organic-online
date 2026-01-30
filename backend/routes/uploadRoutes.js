const express = require("express");
const router = express.Router();
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const { uploadToCloudinary } = require("../config/firebase");

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
// @desc  Uploads file to Firebase Storage (PDFs and Images)
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const fileType = req.file.mimetype;
    const isPdf = fileType === "application/pdf";
    const isImage = fileType.startsWith("image/");

    // Validate Cloudinary is configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("Cloudinary not properly configured");
      return res.status(500).json({ message: "Upload service not configured" });
    }

    const folder = req.body.folder || (isPdf ? "pdfs" : "images");
    const baseName =
      req.body.publicId || path.parse(req.file.originalname).name;
    const uniqueId = crypto.randomBytes(6).toString("hex");
    const fileName =
      `${baseName}-${uniqueId}${path.extname(req.file.originalname)}`.replace(
        /[^a-zA-Z0-9-_\.]/g,
        "",
      );

    try {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(
        fileName,
        req.file.buffer,
        fileType,
        folder,
      );

      const metadata = {
        url: result.url,
        fileName: result.fileName,
        publicId: result.publicId,
        fileType: result.fileType,
        size: req.file.size,
        service: "Cloudinary",
      };

      return res.status(201).json({
        url: result.url,
        ...metadata,
        download_url: result.url,
      });
    } catch (uploadError) {
      console.error("Upload error:", uploadError.message);
      console.error("Full error:", uploadError);
      return res.status(500).json({
        message: uploadError.message || "Error uploading file",
        error:
          process.env.NODE_ENV === "development"
            ? uploadError.message
            : undefined,
      });
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
