import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";
import {
  Users,
  Building,
  Check,
  X,
  Eye,
  FileCheck,
  LogOut,
  Settings,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  FileText
} from "lucide-react";
import client from "../../api/client";

const VendorOnboarderDashboard = () => {
  const { user, logout } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [activeTab, setActiveTab] = useState("pending"); // pending, all
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDocRejectModal, setShowDocRejectModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchVendors();
  }, [activeTab]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      // Sub-admin only views pending or under_review vendor registrations
      const statusFilter = activeTab === "pending" ? "pending" : "";
      const { data } = await client.get(`/admin/vendors?status=${statusFilter}`);
      setVendors(data.vendors || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch vendors list");
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSelect = async (vendorId) => {
    try {
      const { data } = await client.get(`/admin/vendors/${vendorId}`);
      setSelectedVendor(data.vendor);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load vendor details");
    }
  };

  const handleDocApproval = async (docId, status, reason = "") => {
    if (!selectedVendor) return;
    try {
      await client.put(`/admin/vendors/${selectedVendor._id}/compliance/${docId}`, {
        status,
        rejectionReason: reason
      });
      setSuccess(`Document ${status} successfully!`);
      // Reload vendor details
      handleVendorSelect(selectedVendor._id);
      fetchVendors();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to update document status");
    }
  };

  const handleVendorStatusUpdate = async (status, reason = "") => {
    if (!selectedVendor) return;
    try {
      await client.put(`/admin/vendors/${selectedVendor._id}/status`, {
        status,
        rejectionReason: reason
      });
      setSuccess(`Vendor onboarding status updated to ${status}!`);
      setSelectedVendor(null);
      fetchVendors();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to update vendor status");
    }
  };

  // Route protection
  if (!user || user.role !== "vendor_onboarder") {
    return <Navigate to="/admin" />;
  }

  return (
    <div className="min-h-screen bg-background pt-20 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-secondary/10 hidden md:flex flex-col fixed left-0 top-20 bottom-0 z-20">
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="flex items-center gap-3 text-primary mb-8">
            <Settings size={24} />
            <span className="font-heading font-bold text-xl">Onboarder Portal</span>
          </div>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-colors ${
                activeTab === "pending"
                  ? "bg-primary text-surface"
                  : "text-text-secondary hover:bg-secondary/5"
              }`}
            >
              <FileCheck size={18} />
              Pending Verification
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-colors ${
                activeTab === "all"
                  ? "bg-primary text-surface"
                  : "text-text-secondary hover:bg-secondary/5"
              }`}
            >
              <Building size={18} />
              All Onboarding
            </button>
          </nav>
        </div>
        <div className="p-6 border-t border-secondary/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-sm transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-grow md:ml-64 p-6 md:p-8 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-primary">Vendor Onboarding Verification</h1>
              <p className="text-sm text-text-secondary mt-1">Logged in as: {user.name} ({user.email})</p>
            </div>
            <button onClick={logout} className="md:hidden flex items-center gap-2 text-red-500 font-medium">
              <LogOut size={18} /> Logout
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 p-4 mb-6 rounded-sm flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 border border-green-100 p-4 mb-6 rounded-sm flex items-center gap-2">
              <Check size={20} />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List Section */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-surface p-4 rounded-sm border border-secondary/10 shadow-sm">
                <h3 className="font-heading font-bold text-primary mb-4">Vendor Applications</h3>
                {loading ? (
                  <div className="text-center py-8 text-text-secondary">Loading vendors...</div>
                ) : vendors.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">No pending vendor applications found.</div>
                ) : (
                  <div className="divide-y divide-secondary/10 max-h-[60vh] overflow-y-auto pr-1">
                    {vendors.map((vendor) => (
                      <button
                        key={vendor._id}
                        onClick={() => handleVendorSelect(vendor._id)}
                        className={`w-full text-left p-3 my-1 rounded-sm transition-all flex flex-col gap-1 border ${
                          selectedVendor && selectedVendor._id === vendor._id
                            ? "bg-primary/5 border-primary/20"
                            : "border-transparent hover:bg-secondary/5"
                        }`}
                      >
                        <span className="font-bold text-primary text-sm">{vendor.businessName}</span>
                        <span className="text-xs text-text-secondary truncate">{vendor.contactPerson} • {vendor.email}</span>
                        <div className="flex justify-between items-center mt-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                            vendor.status === "pending"
                              ? "bg-yellow-50 text-yellow-600 border border-yellow-100"
                              : vendor.status === "under_review"
                              ? "bg-blue-50 text-blue-600 border border-blue-100"
                              : vendor.status === "subadmin_approved"
                              ? "bg-purple-50 text-purple-600 border border-purple-100"
                              : "bg-green-50 text-green-600 border border-green-100"
                          }`}>
                            {vendor.status.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-text-secondary">
                            {new Date(vendor.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="lg:col-span-2">
              {selectedVendor ? (
                <div className="bg-surface rounded-sm border border-secondary/10 shadow-sm p-6 space-y-6 animate-fade-in">
                  <div className="flex justify-between items-start border-b border-secondary/10 pb-4">
                    <div>
                      <h2 className="font-heading text-2xl font-bold text-primary">{selectedVendor.businessName}</h2>
                      <p className="text-text-secondary text-sm">{selectedVendor.businessDescription || "No description provided."}</p>
                    </div>
                    <span className="bg-primary/5 text-primary border border-primary/10 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider">
                      {selectedVendor.businessType}
                    </span>
                  </div>

                  {/* Business Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Users size={16} className="text-primary" />
                      <span><strong>Contact Person:</strong> {selectedVendor.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Mail size={16} className="text-primary" />
                      <span><strong>Email:</strong> {selectedVendor.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Phone size={16} className="text-primary" />
                      <span><strong>Phone:</strong> {selectedVendor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <MapPin size={16} className="text-primary" />
                      <span>
                        <strong>Address:</strong> {selectedVendor.address?.street}, {selectedVendor.address?.city}, {selectedVendor.address?.state} {selectedVendor.address?.postalCode}
                      </span>
                    </div>
                  </div>

                  {/* Legal Documents */}
                  <div className="border-t border-secondary/10 pt-6">
                    <h3 className="font-heading font-bold text-primary mb-4 flex items-center gap-2">
                      <FileText size={18} /> Compliance Documents Verification
                    </h3>
                    
                    {selectedVendor.complianceDocuments && selectedVendor.complianceDocuments.length > 0 ? (
                      <div className="space-y-4">
                        {selectedVendor.complianceDocuments.map((doc) => (
                          <div key={doc._id} className="bg-secondary/5 p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-secondary/10">
                            <div>
                              <p className="font-bold text-primary text-sm">{doc.name}</p>
                              <p className="text-xs text-text-secondary uppercase tracking-wider mt-0.5">{doc.type.replace("_", " ")}</p>
                              {doc.expiryDate && (
                                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                                  <Calendar size={12} /> Expiry: {new Date(doc.expiryDate).toLocaleDateString()}
                                </p>
                              )}
                              {doc.rejectionReason && doc.status === "rejected" && (
                                <p className="text-xs text-red-500 mt-2 font-medium bg-red-50 p-2 rounded-sm border border-red-100">
                                  Reason for Rejection: {doc.rejectionReason}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 self-start md:self-auto">
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 border border-secondary/20 hover:border-primary text-text-secondary hover:text-primary rounded-sm transition-colors"
                                title="View Document"
                              >
                                <Eye size={16} />
                              </a>
                              {doc.status === "pending" ? (
                                <>
                                  <button
                                    onClick={() => handleDocApproval(doc._id, "approved")}
                                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-sm transition-colors flex items-center gap-1 text-xs font-bold"
                                    title="Approve Document"
                                  >
                                    <Check size={16} /> Verify
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedDocId(doc._id);
                                      setShowDocRejectModal(true);
                                    }}
                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-sm border border-red-200 transition-colors flex items-center gap-1 text-xs font-bold"
                                    title="Reject Document"
                                  >
                                    <X size={16} /> Reject
                                  </button>
                                </>
                              ) : (
                                <span className={`text-xs font-bold px-2 py-1 rounded-sm uppercase ${
                                  doc.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {doc.status}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-secondary italic">No compliance documents uploaded yet.</p>
                    )}
                  </div>

                  {/* Vendor Application Verdict */}
                  <div className="border-t border-secondary/10 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-primary">Onboarding Recommendation</h4>
                      <p className="text-xs text-text-secondary mt-0.5">Approve registration after validating documents above.</p>
                    </div>
                    {["pending", "under_review"].includes(selectedVendor.status) ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVendorStatusUpdate("subadmin_approved")}
                          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-sm font-bold uppercase tracking-wider text-xs transition-colors flex items-center gap-2"
                        >
                          <Check size={16} /> Recommend Approval
                        </button>
                        <button
                          onClick={() => setShowRejectModal(true)}
                          className="px-5 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-sm font-bold uppercase tracking-wider text-xs transition-colors flex items-center gap-2"
                        >
                          <X size={16} /> Reject Application
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-primary">
                        Application Onboarding Status: <span className="uppercase text-accent">{selectedVendor.status.replace("_", " ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-surface rounded-sm border border-secondary/10 shadow-sm p-12 text-center text-text-secondary h-full flex flex-col items-center justify-center">
                  <Building size={48} className="text-secondary/30 mb-4 animate-pulse" />
                  <h3 className="font-heading font-bold text-lg text-primary">No Vendor Selected</h3>
                  <p className="text-sm max-w-xs mx-auto mt-2">Select a vendor application from the side panel to review compliance certificates and verify profiles.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Reject Vendor Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-md rounded-sm shadow-xl p-6 border border-secondary/10 animate-scale-up">
            <h3 className="font-heading font-bold text-lg text-primary mb-4">Reject Vendor Registration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Reason for Rejection</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none text-sm"
                  rows="4"
                  placeholder="Specify why this vendor profile is rejected..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 border border-secondary/20 rounded-sm text-xs font-bold text-text-secondary uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!rejectionReason.trim()) {
                      alert("Please provide a rejection reason.");
                      return;
                    }
                    handleVendorStatusUpdate("rejected", rejectionReason);
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-sm text-xs font-bold uppercase"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Compliance Document Modal */}
      {showDocRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-md rounded-sm shadow-xl p-6 border border-secondary/10 animate-scale-up">
            <h3 className="font-heading font-bold text-lg text-primary mb-4">Reject Compliance Certificate</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Reason for Document Rejection</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-background border border-secondary/20 p-3 rounded-sm focus:border-accent outline-none text-sm"
                  rows="4"
                  placeholder="e.g. Unreadable scan, expired document, wrong file uploaded..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDocRejectModal(false);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 border border-secondary/20 rounded-sm text-xs font-bold text-text-secondary uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!rejectionReason.trim()) {
                      alert("Please provide a rejection reason.");
                      return;
                    }
                    handleDocApproval(selectedDocId, "rejected", rejectionReason);
                    setShowDocRejectModal(false);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-sm text-xs font-bold uppercase"
                >
                  Reject Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOnboarderDashboard;
