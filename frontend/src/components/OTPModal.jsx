import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const OTP_LENGTH = 6;
const RESEND_TIMEOUT_SECONDS = 60;

const OTPModal = ({
  isOpen,
  title = "Enter Verification Code",
  description,
  onClose,
  onVerify,
  onResend,
}) => {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_TIMEOUT_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const inputsRef = useRef([]);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const target = document.getElementById("modal-root");
      if (!target) {
        console.warn("OTPModal: #modal-root not found. Falling back to document.body. Please refresh the page if this persists.");
        setPortalTarget(document.body);
      } else {
        console.log("OTPModal: Mounting to #modal-root");
        setPortalTarget(target);
      }
    } else {
      setPortalTarget(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setDigits(Array(OTP_LENGTH).fill(""));
    setActiveIndex(0);
    setSecondsLeft(RESEND_TIMEOUT_SECONDS);
    setError("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (secondsLeft <= 0) return;

    const timer = setInterval(
      () => setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0)),
      1000,
    );
    return () => clearInterval(timer);
  }, [isOpen, secondsLeft]);

  useEffect(() => {
    if (!isOpen) return;
    const el = inputsRef.current[activeIndex];
    if (el) {
      el.focus();
      el.select();
    }
  }, [activeIndex, isOpen]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError("");

    if (value && index < OTP_LENGTH - 1) {
      setActiveIndex(index + 1);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        setActiveIndex(index - 1);
      }
    }
    if (e.key === "ArrowLeft" && index > 0) {
      setActiveIndex(index - 1);
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      setActiveIndex(index + 1);
    }
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const otp = digits.join("");
    if (otp.length !== OTP_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await onVerify(otp);
    } catch (err) {
      setError(err?.message || "Failed to verify code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || resending) return;
    try {
      setResending(true);
      setError("");
      await onResend();
      setSecondsLeft(RESEND_TIMEOUT_SECONDS);
    } catch (err) {
      setError(err?.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (!isOpen || !portalTarget) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-2 border-accent/20 animate-scale-in">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-primary">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-text-secondary/90 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary/60 hover:text-primary transition-colors p-1"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2 px-2">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputsRef.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 border-secondary/20 bg-background focus:border-accent focus:ring-4 focus:ring-accent/20 outline-none transition-all"
              />
            ))}
          </div>

          {error && (
            <div className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 animate-fade-in">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-text-secondary px-1">
            <span className="font-medium">
              {secondsLeft > 0
                ? `Resend available in ${secondsLeft}s`
                : "Didn't receive code?"}
            </span>
            <button
              type="button"
              disabled={secondsLeft > 0 || resending}
              onClick={handleResend}
              className="font-bold text-accent hover:text-accent/80 disabled:text-text-secondary/40 disabled:cursor-not-allowed transition-colors"
            >
              {resending ? "Resending..." : "Resend OTP"}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white py-3.5 text-base font-bold rounded-xl hover:bg-primary/95 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md uppercase tracking-wider"
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              "Verify Securely"
            )}
          </button>
        </form>
      </div>
    </div>,
    portalTarget
  );
};

export default OTPModal;

