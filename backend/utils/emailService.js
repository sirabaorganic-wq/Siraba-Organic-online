const nodemailer = require("nodemailer");

// Create a reusable Nodemailer transporter based on environment configuration
const createTransporter = () => {
  // If custom SMTP host is provided, prefer that over well-known services
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Fallback to Gmail-style configuration for development
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Simple check to see if email is properly configured
const isEmailConfigured = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return false;
  }
  if (process.env.EMAIL_USER === "your_email@gmail.com") {
    return false;
  }
  return true;
};

// Build a clean HTML template for OTP emails
const buildOtpEmailHtml = (otp, contextLabel) => {
  const safeContext = contextLabel || "verification";

  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f7; padding: 24px;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);">
        <div style="padding: 20px 24px; border-bottom: 1px solid #f1f5f9; background: linear-gradient(135deg, #14532d, #16a34a);">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #f9fafb;">
            Siraba Organic
          </h1>
          <p style="margin: 4px 0 0; font-size: 13px; color: #e5e7eb;">
            One-time password for ${safeContext}
          </p>
        </div>
        <div style="padding: 24px 24px 8px;">
          <p style="font-size: 14px; color: #0f172a; margin: 0 0 12px;">
            Hi there,
          </p>
          <p style="font-size: 14px; color: #1f2937; margin: 0 0 16px; line-height: 1.6;">
            Use the one-time password below to complete your ${safeContext} on
            <strong>Siraba Organic</strong>. This code is valid for
            <strong>10 minutes</strong>.
          </p>
          <div style="margin: 16px 0 20px; text-align: center;">
            <div style="display: inline-block; letter-spacing: 8px; font-size: 24px; font-weight: 700; padding: 12px 20px; border-radius: 999px; background-color: #ecfdf3; color: #14532d; font-family: 'SF Mono', ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px; line-height: 1.6;">
            For your security, never share this code with anyone. Siraba Organic staff will
            <strong>never</strong> ask you for your OTP.
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin: 0 0 4px;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
        <div style="padding: 12px 24px 18px; border-top: 1px solid #f1f5f9; background-color: #f9fafb;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} Siraba Organic. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;
};

// Send an OTP email with HTML template
const sendOTPEmail = async (to, otp, contextLabel) => {
  const normalizedEmail = (to || "").toLowerCase().trim();

  if (!normalizedEmail) {
    throw new Error("Recipient email is required for OTP email");
  }

  // In development, if email is not configured, log OTP instead of failing hard
  if (!isEmailConfigured()) {
    console.log(
      `[DEV ONLY] OTP email not sent (email not configured). Email: ${normalizedEmail}, OTP: ${otp}, Context: ${contextLabel}`,
    );
    return;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from:
      process.env.EMAIL_FROM ||
      `Siraba Organic <${process.env.EMAIL_USER}>`,
    to: normalizedEmail,
    subject: "Your Siraba Organic verification code",
    html: buildOtpEmailHtml(otp, contextLabel),
  });
};

module.exports = {
  sendOTPEmail,
  buildOtpEmailHtml,
  isEmailConfigured,
};

