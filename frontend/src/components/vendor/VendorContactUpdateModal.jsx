import React, { useState } from "react";
import { Mail, Phone, X, ArrowRight, ShieldCheck, CheckCircle, AlertCircle } from "lucide-react";
import client from "../../api/client";
import OTPModal from "../OTPModal";

const VendorContactUpdateModal = ({
  isOpen,
  type = "email", // "email" | "phone"
  currentValue = "",
  onClose,
  onUpdateSuccess,
  updateProfile,
}) => {
  const [newValue, setNewValue] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const isEmail = type === "email";

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedValue = newValue.trim();

    if (!trimmedValue) {
      setErrorMessage(`Please enter a valid new ${isEmail ? "email address" : "phone number"}.`);
      return;
    }

    if (trimmedValue.toLowerCase() === (currentValue || "").toLowerCase()) {
      setErrorMessage(`New ${isEmail ? "email" : "phone number"} must be different from current.`);
      return;
    }

    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) {
        setErrorMessage("Please enter a valid email address.");
        return;
      }
    } else {
      const phoneRegex = /^[6-9]\d{9}$/; // Standard 10-digit Indian mobile number check
      if (!phoneRegex.test(trimmedValue.replace(/\D/g, ""))) {
        setErrorMessage("Please enter a valid 10-digit mobile number.");
        return;
      }
    }

    setSendingOtp(true);
    try {
      if (isEmail) {
        await client.post("/otp/send-email", {
          email: trimmedValue,
          context: "Vendor Email Update",
        });
      } else {
        await client.post("/otp/send-phone", {
          phone: trimmedValue,
          context: "Vendor Phone Update",
        });
      }

      setSendingOtp(false);
      setOtpModalOpen(true);
    } catch (err) {
      setSendingOtp(false);
      setErrorMessage(
        err.response?.data?.message || `Failed to send OTP to ${trimmedValue}. Please try again.`
      );
    }
  };

  const handleVerifyOtp = async (otpCode) => {
    setErrorMessage("");
    const trimmedValue = newValue.trim();

    const payload = isEmail
      ? { email: trimmedValue, emailOtp: otpCode }
      : { phone: trimmedValue, phoneOtp: otpCode };

    const res = await updateProfile(payload);

    if (res.success) {
      setOtpModalOpen(false);
      setSuccessMessage(`${isEmail ? "Email address" : "Phone number"} updated successfully!`);
      if (onUpdateSuccess) onUpdateSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      throw new Error(res.message || "Verification failed. Invalid OTP.");
    }
  };

  const handleResendOtp = async () => {
    const trimmedValue = newValue.trim();
    if (isEmail) {
      await client.post("/otp/send-email", {
        email: trimmedValue,
        context: "Vendor Email Update",
      });
    } else {
      await client.post("/otp/send-phone", {
        phone: trimmedValue,
        context: "Vendor Phone Update",
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-md max-w-md w-full shadow-2xl border border-secondary/10 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-primary to-accent text-surface flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-surface/10 rounded-sm">
                {isEmail ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-heading font-medium text-lg">
                  Update {isEmail ? "Email Address" : "Phone Number"}
                </h3>
                <p className="text-xs text-surface/80 font-light">
                  Requires 6-digit OTP verification
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 rounded-sm border border-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-50 text-green-700 rounded-sm border border-green-200 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-text-secondary uppercase tracking-wider font-medium">
                Current {isEmail ? "Email" : "Phone"}
              </label>
              <div className="p-3 bg-secondary/5 rounded-sm text-sm font-medium text-primary border border-secondary/10">
                {currentValue || "Not provided"}
              </div>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary uppercase tracking-wider font-medium mb-2">
                  New {isEmail ? "Email Address" : "Phone Number"} *
                </label>
                <input
                  type={isEmail ? "email" : "tel"}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={isEmail ? "vendor@example.com" : "9876543210"}
                  required
                  className="w-full px-4 py-3 border border-secondary/20 rounded-sm focus:ring-2 focus:ring-accent/30 focus:border-accent bg-background/50 transition-all text-sm"
                />
              </div>

              <div className="p-3 bg-accent/10 rounded-sm border border-accent/20 text-xs text-primary flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>
                  We will send a 6-digit OTP to verify your ownership of the new {isEmail ? "email" : "phone number"}.
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-secondary/20 rounded-sm text-xs font-bold uppercase tracking-wider text-text-secondary hover:bg-secondary/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="flex-1 py-3 bg-accent text-primary rounded-sm hover:bg-primary hover:text-surface text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sendingOtp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <OTPModal
        isOpen={otpModalOpen}
        title={`Verify New ${isEmail ? "Email" : "Phone Number"}`}
        description={`Enter the 6-digit code sent to ${newValue}`}
        onClose={() => setOtpModalOpen(false)}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
      />
    </>
  );
};

export default VendorContactUpdateModal;
