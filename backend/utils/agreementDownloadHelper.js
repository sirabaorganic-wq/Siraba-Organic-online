const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");
const { cloudinary } = require("../config/firebase");

/**
 * Extract Cloudinary publicId from a secure URL
 */
function getCloudinaryPublicIdFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  const cleaned = url.split("?")[0];
  const uploadIndex = cleaned.indexOf("/upload/");
  if (uploadIndex === -1) return null;
  let pathPart = cleaned.substring(uploadIndex + 8);
  // Remove version prefix if exists (e.g. v1790917761/)
  pathPart = pathPart.replace(/^v\d+\//, "");
  // If ends with .pdf.pdf, remove trailing .pdf
  if (pathPart.endsWith(".pdf.pdf")) {
    pathPart = pathPart.slice(0, -4);
  }
  return pathPart;
}

/**
 * Stream remote URL to response with automatic redirect following
 */
function streamRemoteUrl(url, res, filename, retryCount = 0) {
  if (retryCount > 5) {
    return res.status(502).json({ message: "Too many redirects fetching document." });
  }

  const client = url.startsWith("https://") ? https : http;

  client
    .get(url, (streamRes) => {
      // Follow HTTP redirects (301, 302, 307, 308)
      if (
        streamRes.statusCode >= 300 &&
        streamRes.statusCode < 400 &&
        streamRes.headers.location
      ) {
        let redirectUrl = streamRes.headers.location;
        if (!redirectUrl.startsWith("http")) {
          const origin = new URL(url).origin;
          redirectUrl = new URL(redirectUrl, origin).toString();
        }
        return streamRemoteUrl(redirectUrl, res, filename, retryCount + 1);
      }

      if (streamRes.statusCode !== 200) {
        console.error(`[agreementDownloadHelper] Remote stream returned HTTP ${streamRes.statusCode}`);
        return res.status(streamRes.statusCode).json({
          message: `Unable to stream document. Remote storage returned status ${streamRes.statusCode}`,
        });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Length");

      if (streamRes.headers["content-length"]) {
        res.setHeader("Content-Length", streamRes.headers["content-length"]);
      }

      streamRes.pipe(res);
    })
    .on("error", (err) => {
      console.error("[agreementDownloadHelper] Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to stream document: " + err.message });
      }
    });
}

/**
 * Send executed agreement PDF securely to response
 */
async function streamAgreementPdf(res, agreement, filename) {
  const docUrl = agreement?.artifact?.documentUrl;

  if (!docUrl) {
    return res.status(404).json({ message: "Agreement has no associated document artifact." });
  }

  // 1. Check local filesystem storage
  if (docUrl.startsWith("/uploads/")) {
    const relative = docUrl.replace(/^\/uploads\//, "");
    const fullPath = path.join(__dirname, "..", "uploads", relative);

    if (fs.existsSync(fullPath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Length");
      return res.sendFile(fullPath);
    }
  }

  // 2. Check Cloudinary storage
  if (
    docUrl.includes("cloudinary.com") &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    const publicId = getCloudinaryPublicIdFromUrl(docUrl);

    if (publicId) {
      try {
        const signedUrl = cloudinary.utils.private_download_url(publicId, "pdf", {
          resource_type: "image",
          type: "upload",
          attachment: true,
        });

        return streamRemoteUrl(signedUrl, res, filename);
      } catch (cloudErr) {
        console.warn("[agreementDownloadHelper] Cloudinary private_download_url error:", cloudErr.message);
      }
    }
  }

  // 3. Remote URL stream with redirect handling
  if (docUrl.startsWith("http://") || docUrl.startsWith("https://")) {
    return streamRemoteUrl(docUrl, res, filename);
  }

  // Fallback 404
  return res.status(404).json({ message: "Document file not accessible at: " + docUrl });
}

module.exports = {
  getCloudinaryPublicIdFromUrl,
  streamAgreementPdf,
};
