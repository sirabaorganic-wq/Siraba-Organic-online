/**
 * Returns a viewable document URL that streams PDF/Images inline
 * preventing browser binary downloads and displaying human-readable files.
 */
export const getDocumentViewUrl = (fileUrl) => {
  if (!fileUrl) return "#";
  if (fileUrl.includes("/api/upload/view-doc")) return fileUrl;

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  return `${baseUrl}/upload/view-doc?url=${encodeURIComponent(fileUrl)}`;
};
