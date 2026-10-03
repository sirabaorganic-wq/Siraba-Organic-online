/**
 * SIRABA ORGANIC — VENDOR TRANSACTIONAL EMAIL SERVICE
 * Provides responsive, branded HTML templates for vendor shipment & order lifecycle milestones.
 * Strictly adheres to customer privacy guidelines (no customer PII / sensitive data).
 */

'use strict';

const { createTransporter, isEmailConfigured } = require('./emailService');
const { VENDOR_NOTIFICATION_EVENTS } = require('../constants/notificationConstants');

/**
 * Format currency in INR
 */
const formatINR = (amount) => {
  if (amount == null || isNaN(amount)) return '₹0.00';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Build responsive HTML email template for vendor events
 */
const buildVendorEmailHtml = ({
  eventTitle,
  vendorName,
  orderNumber,
  vendorOrderNumber,
  statusLabel,
  statusBadgeColor,
  contentHtml,
  actionUrl,
  actionText,
}) => {
  const currentYear = new Date().getFullYear();
  const badgeColor = statusBadgeColor || '#16a34a';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; color: #1f2937;">
  <div style="background-color: #f4f5f7; padding: 32px 16px;">
    <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #14532d 0%, #15803d 100%); padding: 24px 32px; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Siraba Organic</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #dcfce7;">Vendor Partner Portal</p>
            </td>
            <td align="right">
              <span style="display: inline-block; background-color: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                ${statusLabel || 'Logistics Update'}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Main Body -->
      <div style="padding: 32px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">
          Hello ${vendorName || 'Vendor Partner'},
        </p>

        <div style="margin: 0 0 24px 0; padding: 14px 18px; background-color: #f8fafc; border-left: 4px solid ${badgeColor}; border-radius: 4px;">
          <h2 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1e293b;">${eventTitle}</h2>
          <p style="margin: 0; font-size: 13px; color: #64748b;">
            Order <strong>#${orderNumber || 'N/A'}</strong> &bull; Sub-Order <strong>${vendorOrderNumber || 'N/A'}</strong>
          </p>
        </div>

        <!-- Custom Milestone Details -->
        ${contentHtml}

        <!-- CTA Button -->
        ${actionUrl ? `
        <div style="margin: 28px 0 20px 0; text-align: center;">
          <a href="${actionUrl}" style="display: inline-block; background-color: #15803d; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 0 2px 4px rgba(21, 128, 61, 0.2);">
            ${actionText || 'View Order in Vendor Portal'}
          </a>
        </div>
        ` : ''}

        <p style="margin: 24px 0 0 0; font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          * Privacy Notice: In accordance with Siraba Organic privacy guidelines, customer contact details are protected and only fulfillment destination details are provided.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
        <p style="margin: 0;">&copy; ${currentYear} Siraba Organic Multi-Vendor Marketplace. All rights reserved.</p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">This is an automated operational notification regarding your seller account.</p>
      </div>

    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate event-specific HTML content based on eventType and metadata
 */
const buildEventContent = (eventType, metadata = {}) => {
  const {
    items = [],
    subtotal,
    deliveryCity,
    deliveryState,
    deliveryPincode,
    courierName,
    awbCode,
    pickupToken,
    pickupScheduledDate,
    failureReason,
    nextAction,
    deliveredAt,
    rtoReason,
    cancelReason,
  } = metadata;

  const destination = [deliveryCity, deliveryState, deliveryPincode].filter(Boolean).join(', ') || 'India';

  switch (eventType) {
    case VENDOR_NOTIFICATION_EVENTS.VENDOR_ORDER_RECEIVED:
    case VENDOR_NOTIFICATION_EVENTS.VENDOR_ORDER_CONFIRMED: {
      const itemsListHtml = items.length > 0 ? `
        <table width="100%" cellpadding="8" cellspacing="0" style="margin: 12px 0; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px;">
          <tr style="background-color: #f8fafc; font-weight: 600; color: #475569;">
            <th align="left">Product</th>
            <th align="center">Qty</th>
            <th align="right">Price</th>
          </tr>
          ${items.map(item => `
            <tr style="border-top: 1px solid #f1f5f9;">
              <td align="left" style="color: #1e293b;">${item.name || item.title || 'Product Item'}</td>
              <td align="center" style="color: #64748b;">${item.quantity || 1}</td>
              <td align="right" style="color: #1e293b; font-weight: 500;">${formatINR(item.price)}</td>
            </tr>
          `).join('')}
        </table>
      ` : '';

      return `
        <div style="font-size: 14px; line-height: 1.6; color: #374151;">
          <p>A new order has been placed for your catalog and confirmed for fulfillment.</p>
          <div style="background-color: #f1f5f9; padding: 12px 16px; border-radius: 6px; margin: 12px 0;">
            <p style="margin: 0; font-size: 13px;"><strong>Destination Region:</strong> ${destination}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px;"><strong>Total Vendor Amount:</strong> ${formatINR(subtotal)}</p>
          </div>
          ${itemsListHtml}
          <p style="font-size: 13px; color: #4b5563; margin-top: 12px;">
            Please ensure items are packaged safely according to Siraba Organic standard organic packaging guidelines.
          </p>
        </div>
      `;
    }

    case VENDOR_NOTIFICATION_EVENTS.PICKUP_SCHEDULED: {
      return `
        <div style="font-size: 14px; line-height: 1.6; color: #374151;">
          <p>Courier pickup has been successfully scheduled with Shiprocket for this package.</p>
          <table width="100%" cellpadding="8" cellspacing="0" style="margin: 14px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px;">
            <tr><td width="38%" style="color: #64748b; font-weight: 500;">Courier Partner:</td><td style="color: #0f172a; font-weight: 600;">${courierName || 'Shiprocket Assigned Courier'}</td></tr>
            <tr><td style="color: #64748b; font-weight: 500;">AWB / Tracking Number:</td><td style="color: #0f172a; font-weight: 600;">${awbCode || 'Pending Assignment'}</td></tr>
            <tr><td style="color: #64748b; font-weight: 500;">Scheduled Date:</td><td style="color: #0f172a; font-weight: 600;">${pickupScheduledDate || 'Next Business Day'}</td></tr>
            ${pickupToken ? `<tr><td style="color: #64748b; font-weight: 500;">Pickup Token:</td><td style="color: #0f172a; font-weight: 600;">${pickupToken}</td></tr>` : ''}
          </table>
          <p style="font-size: 13px; color: #15803d; font-weight: 500;">
            &check; Please affix the shipping label securely on the package and have it ready for courier handover.
          </p>
        </div>
      `;
    }

    case VENDOR_NOTIFICATION_EVENTS.PICKUP_FAILED: {
      return `
        <div style="font-size: 14px; line-height: 1.6; color: #374151;">
          <p style="color: #b91c1c; font-weight: 600;">The courier pickup attempt could not be completed.</p>
          <table width="100%" cellpadding="8" cellspacing="0" style="margin: 14px 0; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; font-size: 13px;">
            <tr><td width="38%" style="color: #991b1b; font-weight: 500;">AWB Number:</td><td style="color: #7f1d1d; font-weight: 600;">${awbCode || 'N/A'}</td></tr>
            <tr><td style="color: #991b1b; font-weight: 500;">Reason Reported:</td><td style="color: #7f1d1d; font-weight: 600;">${failureReason || 'Courier was unable to collect shipment'}</td></tr>
            <tr><td style="color: #991b1b; font-weight: 500;">Required Action:</td><td style="color: #7f1d1d; font-weight: 600;">${nextAction || 'Verify warehouse readiness. Our operations team will reschedule pickup.'}</td></tr>
          </table>
          <p style="font-size: 13px; color: #4b5563;">
            If you need immediate assistance or have questions regarding this pickup attempt, please contact seller support.
          </p>
        </div>
      `;
    }

    case VENDOR_NOTIFICATION_EVENTS.DELIVERED: {
      return `
        <div style="font-size: 14px; line-height: 1.6; color: #374151;">
          <p style="color: #15803d; font-weight: 600;">Shipment successfully delivered to the customer!</p>
          <table width="100%" cellpadding="8" cellspacing="0" style="margin: 14px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 13px;">
            <tr><td width="38%" style="color: #166534; font-weight: 500;">AWB Number:</td><td style="color: #14532d; font-weight: 600;">${awbCode || 'N/A'}</td></tr>
            <tr><td style="color: #166534; font-weight: 500;">Courier:</td><td style="color: #14532d; font-weight: 600;">${courierName || 'Shiprocket'}</td></tr>
            <tr><td style="color: #166534; font-weight: 500;">Destination:</td><td style="color: #14532d; font-weight: 600;">${destination}</td></tr>
            <tr><td style="color: #166534; font-weight: 500;">Delivered At:</td><td style="color: #14532d; font-weight: 600;">${deliveredAt ? new Date(deliveredAt).toLocaleString('en-IN') : 'Confirmed Delivered'}</td></tr>
          </table>
          <p style="font-size: 13px; color: #4b5563;">
            Order settlement and vendor payout will proceed as per your marketplace payment schedule.
          </p>
        </div>
      `;
    }

    case VENDOR_NOTIFICATION_EVENTS.DELIVERY_FAILED: {
      return `
        <div style="font-size: 14px; line-height: 1.6; color: #374151;">
          <p style="color: #c2410c; font-weight: 600;">Delivery attempt failed by the courier.</p>
          <table width="100%" cellpadding="8" cellspacing="0" style="margin: 14px 0; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; font-size: 13px;">
            <tr><td width="38%" style="color: #9a3412; font-weight: 500;">AWB Number:</td><td style="color: #7c2d12; font-weight: 600;">${awbCode || 'N/A'}</td></tr>
            <tr><td style="color: #9a3412; font-weight: 500;">Courier Remark:</td><td style="color: #7c2d12; font-weight: 600;">${failureReason || 'Customer unavailable / incorrect address'}</td></tr>
            <tr><td style="color: #9a3412; font-weight: 500;">Next Step:</td><td style="color: #7c2d12; font-weight: 600;">Courier will re-attempt delivery or contact recipient.</td></tr>
          </table>
        </div>
      `;
    }

    case VENDOR_NOTIFICATION_EVENTS.RTO_INITIATED:
    case VENDOR_NOTIFICATION_EVENTS.RTO_DELIVERED: {
      const isDelivered = eventType === VENDOR_NOTIFICATION_EVENTS.RTO_DELIVERED;
      return `
        <div style="font-size: 14px; line-height: 1.6; color: #374151;">
          <p style="color: #dc2626; font-weight: 600;">
            ${isDelivered ? 'RTO Shipment returned and delivered back to warehouse.' : 'Return to Origin (RTO) has been initiated for this package.'}
          </p>
          <table width="100%" cellpadding="8" cellspacing="0" style="margin: 14px 0; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; font-size: 13px;">
            <tr><td width="38%" style="color: #991b1b; font-weight: 500;">AWB Number:</td><td style="color: #7f1d1d; font-weight: 600;">${awbCode || 'N/A'}</td></tr>
            <tr><td style="color: #991b1b; font-weight: 500;">RTO Reason:</td><td style="color: #7f1d1d; font-weight: 600;">${rtoReason || failureReason || 'Delivery undeliverable after multiple attempts'}</td></tr>
            <tr><td style="color: #991b1b; font-weight: 500;">Status:</td><td style="color: #7f1d1d; font-weight: 600;">${isDelivered ? 'Delivered back to vendor' : 'In return transit'}</td></tr>
          </table>
          <p style="font-size: 13px; color: #4b5563;">
            Please verify package inventory upon physical receipt at your warehouse.
          </p>
        </div>
      `;
    }

    case VENDOR_NOTIFICATION_EVENTS.ORDER_CANCELLED: {
      return `
        <div style="font-size: 14px; line-height: 1.6; color: #374151;">
          <p style="color: #dc2626; font-weight: 600;">This vendor order has been cancelled.</p>
          <table width="100%" cellpadding="8" cellspacing="0" style="margin: 14px 0; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; font-size: 13px;">
            <tr><td width="38%" style="color: #991b1b; font-weight: 500;">Cancellation Reason:</td><td style="color: #7f1d1d; font-weight: 600;">${cancelReason || 'Customer requested / Stock discrepancy'}</td></tr>
          </table>
          <p style="font-size: 13px; color: #4b5563;">
            Please halt any fulfillment activity if shipment has not been handed over.
          </p>
        </div>
      `;
    }

    default: {
      return `
        <div style="font-size: 14px; line-height: 1.6; color: #374151;">
          <p>There is a status update regarding your order shipment.</p>
          ${awbCode ? `<p><strong>AWB Number:</strong> ${awbCode}</p>` : ''}
          ${courierName ? `<p><strong>Courier:</strong> ${courierName}</p>` : ''}
        </div>
      `;
    }
  }
};

/**
 * Sends a transactional email to the vendor for a specific lifecycle event.
 * Never throws unhandled errors so logistics flow is never disrupted.
 *
 * @param {object} params
 * @param {string} params.vendorEmail
 * @param {string} params.vendorName
 * @param {string} params.eventType
 * @param {string} params.orderNumber
 * @param {string} params.vendorOrderNumber
 * @param {string} params.title
 * @param {object} params.metadata
 * @returns {Promise<{ success: boolean, messageId?: string, skipped?: boolean, error?: string }>}
 */
const sendVendorShipmentEmail = async ({
  vendorEmail,
  vendorName,
  eventType,
  orderNumber,
  vendorOrderNumber,
  title,
  eventId,
  metadata = {},
}) => {
  try {
    const normalizedEmail = (vendorEmail || '').toLowerCase().trim();
    if (!normalizedEmail) {
      return { success: false, error: 'Recipient email is missing' };
    }

    const eventTitle = title || `Order Update: #${orderNumber || ''}`;
    const contentHtml = buildEventContent(eventType, metadata);

    // Pick badge color based on event severity
    let badgeColor = '#16a34a';
    let statusLabel = 'Logistics Update';
    if (eventType.includes('FAILED') || eventType.includes('CANCELLED')) {
      badgeColor = '#dc2626';
      statusLabel = 'Action Required';
    } else if (eventType.includes('RTO')) {
      badgeColor = '#ea580c';
      statusLabel = 'Return to Origin';
    } else if (eventType === VENDOR_NOTIFICATION_EVENTS.PICKUP_SCHEDULED) {
      badgeColor = '#2563eb';
      statusLabel = 'Pickup Scheduled';
    } else if (eventType === VENDOR_NOTIFICATION_EVENTS.DELIVERED) {
      badgeColor = '#15803d';
      statusLabel = 'Delivered';
    }

    const portalBaseUrl = process.env.CLIENT_URL || 'https://sirabaorganic.com';
    const actionUrl = `${portalBaseUrl}/vendor/orders`;

    const html = buildVendorEmailHtml({
      eventTitle,
      vendorName,
      orderNumber,
      vendorOrderNumber,
      statusLabel,
      statusBadgeColor: badgeColor,
      contentHtml,
      actionUrl,
      actionText: 'Review Order in Vendor Portal',
    });

    const safeMessageId = `<${(eventId || `evt_${Date.now()}`).replace(/[^a-zA-Z0-9_.-]/g, '_')}@sirabaorganic.com>`;

    if (!isEmailConfigured()) {
      console.log(`[VendorEmailDev] Simulated email to ${normalizedEmail} | Event: ${eventType} | Subject: ${eventTitle} | Message-ID: ${safeMessageId}`);
      return { success: true, skipped: true, messageId: safeMessageId };
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Siraba Organic Operations'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: `[Siraba Partner] ${eventTitle}`,
      html,
      messageId: safeMessageId,
      headers: {
        'X-Siraba-Event-ID': eventId || '',
        'X-Siraba-Order-ID': orderNumber || '',
        'X-Siraba-Vendor-Order-ID': vendorOrderNumber || '',
      },
    });

    return { success: true, messageId: info.messageId || safeMessageId };
  } catch (err) {
    console.error(`[VendorEmailService] Failed to send email for event ${eventType}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendVendorShipmentEmail,
  buildEventContent,
  buildVendorEmailHtml,
};
