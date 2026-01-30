import React, { useState, useRef } from "react";
import { Upload, X, Check, AlertCircle } from "lucide-react";
import client from "../api/client";

/**
 * ImageUploadField Component
 * Handles image uploads to Firebase Storage
 * Supports drag-and-drop, file selection, and preview
 */
const ImageUploadField = ({
  images = [],
  onImagesChange,
  maxImages = 5,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const handleFiles = async (files) => {
    if (images.length >= maxImages) {
      setUploadError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, maxImages - images.length);

    setUploading(true);
    setUploadError("");

    try {
      for (const file of filesToUpload) {
        // Validate file
        if (!file.type.startsWith("image/")) {
          setUploadError(`${file.name} is not an image file`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          setUploadError(`${file.name} is larger than 5MB`);
          continue;
        }

        // Upload file
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "products");

        try {
          const response = await client.post("/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setUploadProgress((prev) => ({
                ...prev,
                [file.name]: percentCompleted,
              }));
            },
          });

          if (response.data.url) {
            onImagesChange([...images, response.data.url]);
          }
        } catch (error) {
          console.error("Upload error:", error);
          setUploadError(
            error.response?.data?.message || `Failed to upload ${file.name}`,
          );
        }
      }
    } finally {
      setUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium mb-2 text-text-secondary uppercase tracking-wide">
        Product Images (max {maxImages})
      </label>

      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          dragCounter.current > 0
            ? "border-accent bg-accent/5"
            : "border-secondary/20 bg-background/50 hover:border-secondary/40"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || uploading || images.length >= maxImages}
          className="hidden"
        />

        <div
          onClick={() =>
            !disabled &&
            !uploading &&
            images.length < maxImages &&
            fileInputRef.current?.click()
          }
          className="space-y-3"
        >
          <div className="flex justify-center">
            <Upload
              className={`w-8 h-8 ${
                uploading ? "text-accent animate-pulse" : "text-secondary/40"
              }`}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-text-secondary">
              {uploading
                ? "Uploading..."
                : "Drag images here or click to select"}
            </p>
            <p className="text-xs text-text-secondary/60 mt-1">
              JPG, PNG, WebP • Max 5MB each • {maxImages - images.length} slots
              remaining
            </p>
          </div>
        </div>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent mx-auto mb-2"></div>
              <p className="text-xs text-text-secondary">Uploading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{uploadError}</p>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg border border-secondary/20 overflow-hidden group bg-background"
            >
              {/* Image */}
              <img
                src={image}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />

              {/* Upload Progress */}
              {Object.keys(uploadProgress).length > 0 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-xs text-white font-medium">
                      {Object.values(uploadProgress)[0]}%
                    </div>
                  </div>
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={() => removeImage(index)}
                disabled={disabled || uploading}
                className="absolute top-1.5 right-1.5 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {index + 1}/{maxImages}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <p className="text-xs text-text-secondary/60 text-center py-4">
          No images uploaded yet. Add images to showcase your product.
        </p>
      )}

      {/* Success Message */}
      {images.length > 0 && !uploading && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <p className="text-xs text-green-700">
            {images.length}/{maxImages} images uploaded
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploadField;
