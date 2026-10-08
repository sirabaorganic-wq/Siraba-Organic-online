/**
 * Scratch Script: generate_ca_package_pdfs.js
 * Generates CA-Ready sample PDFs for the four document types in Siraba Organic.
 * DOES NOT TOUCH PRODUCTION DATA OR THE DATABASE.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const handlebars = require(path.join(__dirname, '../backend/node_modules/handlebars'));
const { renderHtmlToPdf, buildPureJsPdf, htmlToTextBlocks } = require(path.join(__dirname, '../backend/utils/puppeteerHelper'));

const targetDir = path.join(__dirname, '../CA_INVOICE_DOCUMENTATION/02_INVOICE_FORMATS');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Read Siraba Logo
let logoBase64 = '';
const logoPath = path.join(__dirname, '../backend/templates/invoices/logo.png');
if (fs.existsSync(logoPath)) {
  logoBase64 = fs.readFileSync(logoPath).toString('base64');
}

// --------------------------------------------------------------------------
// 1. CUSTOMER PRODUCT TAX INVOICE (Vendor -> Customer)
// --------------------------------------------------------------------------
async function generateCustomerTaxInvoicePdf() {
  const templatePath = path.join(__dirname, '../backend/templates/invoices/invoice-template.html');
  const templateContent = fs.readFileSync(templatePath, 'utf8');

  const data = {
    logoBase64,
    companyName: 'Noor Saffron & Spice Guild',
    tradeName: 'Noor Organics',
    companyAddress: 'Kashmir Saffron Park, Ladhoo Road',
    companyCityState: 'Pampore, Jammu and Kashmir - 192121',
    sellerStateCode: '01',
    sellerGST: '01AAACN1234F1Z9',
    companyEmail: 'contact@noororganics.com',
    companyPhone: '+91 99066 11223',
    facilitatorName: 'Siraba Organic',

    invoiceNumber: 'VND-2F34D3/26-27/000001',
    invoiceDate: '05/10/2026',
    orderId: '67039a8c12b4e89f01234567',
    orderShortId: '78A1B2C3',
    vendorOrderShortId: 'VO-99D4E2',
    orderStatus: 'CONFIRMED',
    paymentMethod: 'Prepaid (Razorpay Online)',

    customerName: 'Bashir Ahmad Dar',
    customerAddress: 'House 14, Rajbagh',
    customerCityState: 'Srinagar, Jammu and Kashmir - 190008',
    customerCountry: 'India',
    customerPhone: '+91 94190 12345',
    buyerGST: null,

    placeOfSupply: 'Jammu and Kashmir (State Code: 01)',
    supplyType: 'Intra-State Supply (CGST + SGST)',

    items: [
      {
        name: 'Super Negin Mongra Saffron 2g',
        sku: 'SAF-MNG-2G',
        hsn: '09102010',
        quantity: 1,
        price: '₹900.00',
        discount: '—',
        taxableAmount: '₹900.00',
        taxRate: '5%',
        total: '₹900.00',
      },
    ],

    subtotal: '₹900.00',
    hasDiscount: false,
    discountAmount: '₹0.00',
    couponCode: '',
    taxableSubtotal: '₹900.00',

    isInterState: false,
    cgstRateDisplay: '2.5%',
    sgstRateDisplay: '2.5%',
    igstRateDisplay: '5%',
    cgstAmount: '₹22.50',
    sgstAmount: '₹22.50',
    igstAmount: '₹0.00',

    shipping: '₹50.00',
    grandTotal: '₹995.00',
    amountInWords: 'Nine Hundred and Ninety Five Rupees Only',
  };

  const compiled = handlebars.compile(templateContent);
  const html = compiled(data);
  const pdf = await renderHtmlToPdf(html);
  const outPath = path.join(targetDir, '01_CUSTOMER_TAX_INVOICE.pdf');
  fs.writeFileSync(outPath, pdf);
  console.log(`[Generated] 01_CUSTOMER_TAX_INVOICE.pdf (${pdf.length} bytes)`);
}

// --------------------------------------------------------------------------
// 2. SIRABA MARKETPLACE / COMMISSION INVOICE (Siraba -> Vendor)
// --------------------------------------------------------------------------
async function generateSirabaCommissionInvoicePdf() {
  const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Commission Tax Invoice - SO-COMM/26-27/000001</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 12mm 15mm; }
    body { font-family: "Helvetica Neue", Arial, sans-serif; background: white; color: #2d3748; font-size: 12px; line-height: 1.4; }
    .invoice-container { max-width: 210mm; margin: 0 auto; background: white; position: relative; }
    .accent-bar { height: 6px; background: linear-gradient(90deg, #1a4d2e 0%, #7cb342 100%); margin-bottom: 16px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid #e2e8f0; }
    .seller-brand { display: flex; align-items: flex-start; gap: 14px; max-width: 58%; }
    .logo { width: 64px; height: 64px; object-fit: contain; }
    .seller-info .seller-badge { display: inline-block; background: #e6f4ea; color: #1a4d2e; font-size: 8.5px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; padding: 2px 7px; border-radius: 3px; margin-bottom: 4px; }
    .seller-info h1 { font-size: 20px; color: #1a4d2e; font-weight: 800; line-height: 1.2; margin-bottom: 2px; }
    .seller-address { color: #4a5568; font-size: 10.5px; line-height: 1.45; }
    .gst-box { display: inline-block; background: #f0f7f0; border: 1px solid #7cb342; padding: 4px 8px; border-radius: 4px; margin-top: 6px; font-size: 11px; }
    .gst-box strong { color: #1a4d2e; }
    .invoice-meta { text-align: right; }
    .marketplace-tag { font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; color: #4a5568; font-weight: 700; margin-bottom: 3px; }
    .doc-title { font-size: 20px; font-weight: 800; color: #1a4d2e; letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 2px; }
    .inv-number { font-size: 13px; font-weight: 700; color: #7cb342; font-family: monospace; margin-bottom: 6px; }
    .meta-row { font-size: 10.5px; color: #4a5568; margin-bottom: 2px; }
    .detail-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 18px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
    .card h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; color: #718096; font-weight: 700; margin-bottom: 6px; }
    .card p { font-size: 11px; color: #4a5568; line-height: 1.4; margin-bottom: 2px; }
    .card p.highlight { font-weight: 700; color: #1a202c; font-size: 12px; }
    .items-section { margin-bottom: 18px; }
    .section-title { font-size: 11px; font-weight: 700; color: #1a4d2e; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1a4d2e; color: white; font-size: 9px; text-transform: uppercase; letter-spacing: 0.6px; padding: 8px 10px; font-weight: 700; text-align: left; }
    th.text-center { text-align: center; }
    th.text-right { text-align: right; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; vertical-align: top; }
    td.text-center { text-align: center; }
    td.text-right { text-align: right; }
    .totals-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .words-container { width: 50%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 10.5px; }
    .words-container strong { color: #1a4d2e; display: block; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; }
    .totals-box { width: 44%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; color: #4a5568; }
    .total-row.tax-component { color: #2b6cb0; font-weight: 600; font-size: 10.5px; }
    .total-row.grand { border-top: 2px solid #1a4d2e; margin-top: 6px; padding-top: 8px; font-size: 14px; font-weight: 800; color: #1a4d2e; }
    .footer { border-top: 2px solid #e2e8f0; padding-top: 14px; margin-top: 20px; font-size: 9.5px; color: #718096; line-height: 1.5; }
    .signatory-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px; }
    .sig-line { display: inline-block; border-top: 1.5px solid #1a4d2e; padding-top: 4px; width: 180px; font-size: 9.5px; color: #1a4d2e; font-weight: 700; text-transform: uppercase; text-align: center; }
    .sac-notice { background: #eef2ff; border: 1px solid #c7d2fe; padding: 6px 10px; border-radius: 4px; font-size: 9.5px; color: #3730a3; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="accent-bar"></div>

    <!-- Header: Siraba Organic as Service Provider / Seller -->
    <div class="header">
      <div class="seller-brand">
        <img src="data:image/png;base64,${logoBase64}" alt="Siraba Organic" class="logo" />
        <div class="seller-info">
          <span class="seller-badge">SERVICE PROVIDER / MARKETPLACE OPERATOR</span>
          <h1>SIRABA ORGANIC PRIVATE LIMITED</h1>
          <div class="seller-address">
            123 Saffron Valley, Pampore<br />
            Pampore, Jammu and Kashmir - 192121 (State Code: 01)<br />
            finance@sirabaorganic.com • +91 99066 93633
          </div>
          <div class="gst-box">
            <strong>GSTIN:</strong> 01AABCS1429B1Z1 &bull; <strong>PAN:</strong> [CA Confirmation Required]
          </div>
        </div>
      </div>

      <div class="invoice-meta">
        <div class="marketplace-tag">B2B TAX INVOICE FOR SERVICES</div>
        <div class="doc-title">COMMISSION INVOICE</div>
        <div class="inv-number">SO-COMM/26-27/000001</div>
        <div class="meta-row"><strong>Invoice Date:</strong> 05/10/2026</div>
        <div class="meta-row"><strong>Order Reference:</strong> #ORD-78A1B2C3</div>
        <div class="meta-row"><strong>Vendor Sub-Order:</strong> #VO-99D4E2</div>
      </div>
    </div>

    <!-- Detail Cards -->
    <div class="detail-cards">
      <div class="card">
        <h3>Billed To (Vendor Partner)</h3>
        <p class="highlight">Noor Saffron &amp; Spice Guild</p>
        <p>Kashmir Saffron Park, Ladhoo Road</p>
        <p>Pampore, Jammu and Kashmir - 192121</p>
        <p style="margin-top: 4px; color: #1a4d2e; font-weight: 700;">✓ Vendor GSTIN: 01AAACN1234F1Z9</p>
        <p>State Code: 01 (Jammu &amp; Kashmir)</p>
      </div>

      <div class="card">
        <h3>Supply &amp; Service Details</h3>
        <p><strong>Place of Supply:</strong></p>
        <p class="highlight">Jammu and Kashmir (State Code: 01)</p>
        <p style="margin-top: 4px;"><strong>Supply Nature:</strong> Intra-State Service (CGST + SGST)</p>
        <p><strong>Reverse Charge (RCM):</strong> No</p>
        <p><strong>Billing Category:</strong> E-Commerce Facilitation Fee</p>
      </div>

      <div class="card">
        <h3>Commercial Plan &amp; Settlement</h3>
        <p class="highlight">Starter Merchant Tier</p>
        <p>Agreed Commission Rate: <strong>10.00%</strong></p>
        <p>Facilitated Gross Order Value: ₹900.00</p>
        <p>Settlement Adjustment: Auto-debited from Gross Merchandise Proceeds</p>
      </div>
    </div>

    <!-- Items Section -->
    <div class="items-section">
      <div class="section-title">Marketplace Facilitation Services Rendered</div>
      <table>
        <thead>
          <tr>
            <th style="width: 42%;">SERVICE DESCRIPTION</th>
            <th class="text-center" style="width: 14%;">SAC CODE</th>
            <th class="text-center" style="width: 8%;">QTY</th>
            <th class="text-right" style="width: 12%;">COMMISSION RATE</th>
            <th class="text-right" style="width: 12%;">TAXABLE VALUE</th>
            <th class="text-center" style="width: 8%;">GST%</th>
            <th class="text-right" style="width: 12%;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Marketplace Facilitation &amp; Platform Commission Services</strong><br />
              <span style="font-size: 9.5px; color: #718096;">Platform facilitation for Order #ORD-78A1B2C3 (Sub-Order #VO-99D4E2) • Gross Value: ₹900.00</span>
            </td>
            <td class="text-center" style="font-weight: 700; color: #1a4d2e; font-family: monospace;">
              998311
            </td>
            <td class="text-center">1</td>
            <td class="text-right">10.00%</td>
            <td class="text-right" style="font-weight: 600;">₹90.00</td>
            <td class="text-center">18%</td>
            <td class="text-right" style="font-weight: 700; color: #1a4d2e;">₹90.00</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Financial Totals -->
    <div class="totals-container">
      <div class="words-container">
        <strong>Invoice Amount in Words:</strong>
        <p style="font-weight: 600; font-size: 11px; color: #1a202c;">One Hundred and Six Rupees and Twenty Paise Only</p>
        
        <div class="sac-notice">
          <strong>Important Statutory Classification Notice:</strong><br />
          This document represents billing for <strong>Marketplace / Platform Facilitation Services</strong> (not physical goods). 
          The transaction is classified under <strong>SAC (Services Accounting Code) 998311</strong> carrying standard 18% GST.<br />
          <em>[Note for CA: Please confirm if SAC 998311 is the final desired classification or if alternative SAC 998371 / 998599 is preferred.]</em>
        </div>
      </div>

      <div class="totals-box">
        <div class="total-row">
          <span>Gross Commission Value</span>
          <span>₹90.00</span>
        </div>
        <div class="total-row" style="font-weight: 600;">
          <span>Taxable Value of Service</span>
          <span>₹90.00</span>
        </div>
        <div class="total-row tax-component">
          <span>Central GST (CGST @ 9.0%)</span>
          <span>₹8.10</span>
        </div>
        <div class="total-row tax-component">
          <span>State GST (SGST @ 9.0%)</span>
          <span>₹8.10</span>
        </div>
        <div class="total-row">
          <span>Integrated GST (IGST @ 18.0%)</span>
          <span>₹0.00</span>
        </div>
        <div class="total-row grand">
          <span>TOTAL INVOICE VALUE</span>
          <span>₹106.20</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        1. This Tax Invoice is issued by Siraba Organic Private Limited to the Vendor Partner for marketplace facilitation services rendered under Section 9 of the CGST Act, 2017.<br />
        2. Recipient vendor partner may claim Input Tax Credit (ITC) on the GST amount of ₹16.20 subject to Section 16 of the CGST Act.<br />
        3. Tax Collected at Source (TCS) under Section 52 of the CGST Act, if applicable, is deposited separately under Siraba's GSTIN.
      </p>

      <div class="signatory-row">
        <div>
          Place: Pampore, J&amp;K<br />
          Date of Issue: 05/10/2026
        </div>
        <div style="text-align: right;">
          <div class="sig-line">
            Authorized Signatory<br />
            <span style="font-size: 8.5px; font-weight: 500; text-transform: none; color: #718096;">For SIRABA ORGANIC PRIVATE LIMITED</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const pdf = await renderHtmlToPdf(htmlContent);
  const outPath = path.join(targetDir, '02_SIRABA_COMMISSION_INVOICE.pdf');
  fs.writeFileSync(outPath, pdf);
  console.log(`[Generated] 02_SIRABA_COMMISSION_INVOICE.pdf (${pdf.length} bytes)`);
}

// --------------------------------------------------------------------------
// 3. CREDIT NOTE (Vendor -> Customer, referencing original invoice)
// --------------------------------------------------------------------------
async function generateCreditNotePdf() {
  const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Credit Note - CN/26-27/000001</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 12mm 15mm; }
    body { font-family: "Helvetica Neue", Arial, sans-serif; background: white; color: #2d3748; font-size: 12px; line-height: 1.4; }
    .invoice-container { max-width: 210mm; margin: 0 auto; background: white; position: relative; }
    .accent-bar { height: 6px; background: linear-gradient(90deg, #c53030 0%, #e53e3e 100%); margin-bottom: 16px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid #e2e8f0; }
    .seller-brand { display: flex; align-items: flex-start; gap: 14px; max-width: 58%; }
    .logo { width: 64px; height: 64px; object-fit: contain; }
    .seller-info .seller-badge { display: inline-block; background: #fff5f5; color: #c53030; font-size: 8.5px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; padding: 2px 7px; border-radius: 3px; margin-bottom: 4px; }
    .seller-info h1 { font-size: 20px; color: #742a2a; font-weight: 800; line-height: 1.2; margin-bottom: 2px; }
    .seller-address { color: #4a5568; font-size: 10.5px; line-height: 1.45; }
    .gst-box { display: inline-block; background: #fff5f5; border: 1px solid #feb2b2; padding: 4px 8px; border-radius: 4px; margin-top: 6px; font-size: 11px; }
    .gst-box strong { color: #9b2c2c; }
    .invoice-meta { text-align: right; }
    .marketplace-tag { font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; color: #4a5568; font-weight: 700; margin-bottom: 3px; }
    .doc-title { font-size: 20px; font-weight: 800; color: #c53030; letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 2px; }
    .inv-number { font-size: 13px; font-weight: 700; color: #e53e3e; font-family: monospace; margin-bottom: 6px; }
    .meta-row { font-size: 10.5px; color: #4a5568; margin-bottom: 2px; }
    .detail-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 18px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
    .card h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; color: #718096; font-weight: 700; margin-bottom: 6px; }
    .card p { font-size: 11px; color: #4a5568; line-height: 1.4; margin-bottom: 2px; }
    .card p.highlight { font-weight: 700; color: #1a202c; font-size: 12px; }
    .items-section { margin-bottom: 18px; }
    .section-title { font-size: 11px; font-weight: 700; color: #9b2c2c; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #9b2c2c; color: white; font-size: 9px; text-transform: uppercase; letter-spacing: 0.6px; padding: 8px 10px; font-weight: 700; text-align: left; }
    th.text-center { text-align: center; }
    th.text-right { text-align: right; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; vertical-align: top; }
    td.text-center { text-align: center; }
    td.text-right { text-align: right; }
    .totals-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .words-container { width: 50%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 10.5px; }
    .words-container strong { color: #9b2c2c; display: block; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; }
    .totals-box { width: 44%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; color: #4a5568; }
    .total-row.tax-component { color: #c53030; font-weight: 600; font-size: 10.5px; }
    .total-row.grand { border-top: 2px solid #9b2c2c; margin-top: 6px; padding-top: 8px; font-size: 14px; font-weight: 800; color: #9b2c2c; }
    .footer { border-top: 2px solid #e2e8f0; padding-top: 14px; margin-top: 20px; font-size: 9.5px; color: #718096; line-height: 1.5; }
    .signatory-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px; }
    .sig-line { display: inline-block; border-top: 1.5px solid #9b2c2c; padding-top: 4px; width: 180px; font-size: 9.5px; color: #9b2c2c; font-weight: 700; text-transform: uppercase; text-align: center; }
    .original-ref-box { background: #fffaf0; border: 1px solid #feebc8; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; font-size: 11px; color: #7b341e; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="accent-bar"></div>

    <!-- Header: Vendor as Seller -->
    <div class="header">
      <div class="seller-brand">
        <img src="data:image/png;base64,${logoBase64}" alt="Siraba Organic" class="logo" />
        <div class="seller-info">
          <span class="seller-badge">SUPPLIER / ISSUING SELLER</span>
          <h1>Noor Saffron &amp; Spice Guild</h1>
          <div class="seller-address">
            Kashmir Saffron Park, Ladhoo Road<br />
            Pampore, Jammu and Kashmir - 192121 (State Code: 01)<br />
            contact@noororganics.com • +91 99066 11223
          </div>
          <div class="gst-box">
            <strong>GSTIN:</strong> 01AAACN1234F1Z9
          </div>
        </div>
      </div>

      <div class="invoice-meta">
        <div class="marketplace-tag">Marketplace: Siraba Organic</div>
        <div class="doc-title">CREDIT NOTE</div>
        <div class="inv-number">CN/26-27/000001</div>
        <div class="meta-row"><strong>Credit Note Date:</strong> 07/10/2026</div>
        <div class="meta-row"><strong>Statutory Ground:</strong> Sec 34 CGST Act, 2017</div>
        <div class="meta-row"><strong>Refund Ref:</strong> REF-2026-00412</div>
      </div>
    </div>

    <!-- Original Invoice Reference Linkage -->
    <div class="original-ref-box">
      <strong>Original Tax Invoice Reference (Section 34 Requirement):</strong><br />
      Issued against Original Tax Invoice Number: <strong>VND-2F34D3/26-27/000001</strong> dated <strong>05/10/2026</strong> • Master Order: <strong>#ORD-78A1B2C3</strong><br />
      <em>Audit Guarantee: The original tax invoice remains 100% immutable in the system ledger. This credit note adjusts outward tax liability without retroactively mutating the original invoice.</em>
    </div>

    <!-- Detail Cards -->
    <div class="detail-cards">
      <div class="card">
        <h3>Credited Customer</h3>
        <p class="highlight">Bashir Ahmad Dar</p>
        <p>House 14, Rajbagh</p>
        <p>Srinagar, Jammu and Kashmir - 190008</p>
        <p>Phone: +91 94190 12345</p>
        <p style="margin-top: 4px; font-size: 10px; color: #718096;">B2C Retail Buyer</p>
      </div>

      <div class="card">
        <h3>Supply Jurisdiction</h3>
        <p><strong>Place of Supply:</strong></p>
        <p class="highlight">Jammu and Kashmir (State Code: 01)</p>
        <p style="margin-top: 4px;"><strong>Supply Nature:</strong> Intra-State Supply</p>
        <p><strong>Tax Reversal:</strong> CGST (2.5%) + SGST (2.5%)</p>
      </div>

      <div class="card">
        <h3>Credit Reason &amp; Disposition</h3>
        <p class="highlight">Product Return / Refund</p>
        <p><strong>Reason:</strong> Customer return - damaged packaging upon delivery</p>
        <p><strong>Goods Returned:</strong> Yes (Returned to Vendor inventory)</p>
        <p><strong>Settlement Mode:</strong> Source Payment Method Reversal</p>
      </div>
    </div>

    <!-- Items Section -->
    <div class="items-section">
      <div class="section-title">Credited Goods Details</div>
      <table>
        <thead>
          <tr>
            <th style="width: 40%;">PRODUCT DESCRIPTION</th>
            <th class="text-center" style="width: 14%;">HSN CODE</th>
            <th class="text-center" style="width: 8%;">QTY</th>
            <th class="text-right" style="width: 12%;">ORIGINAL PRICE</th>
            <th class="text-right" style="width: 14%;">TAXABLE VAL CREDITED</th>
            <th class="text-center" style="width: 8%;">GST%</th>
            <th class="text-right" style="width: 12%;">CREDIT TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Super Negin Mongra Saffron 2g</strong><br />
              <span style="font-size: 9.5px; color: #718096;">SKU: SAF-MNG-2G • Grade 1 GI-Tagged Kashmiri Saffron</span>
            </td>
            <td class="text-center" style="font-weight: 600; color: #4a5568;">09102010</td>
            <td class="text-center" style="font-weight: 700;">1</td>
            <td class="text-right">₹900.00</td>
            <td class="text-right" style="font-weight: 600;">₹900.00</td>
            <td class="text-center">5%</td>
            <td class="text-right" style="font-weight: 700; color: #9b2c2c;">₹900.00</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Financial Totals -->
    <div class="totals-container">
      <div class="words-container">
        <strong>Credit Amount in Words:</strong>
        <p style="font-weight: 600; font-size: 11px; color: #1a202c;">Nine Hundred and Forty Five Rupees Only</p>
        <div style="margin-top: 8px; font-size: 9.5px; color: #718096; line-height: 1.4;">
          * In accordance with Section 34(2) of the CGST Act, any registered person who issues a credit note in relation to a supply of goods shall declare the details in the return for the month during which such credit note has been issued.
        </div>
      </div>

      <div class="totals-box">
        <div class="total-row">
          <span>Gross Value of Returned Goods</span>
          <span>₹900.00</span>
        </div>
        <div class="total-row" style="font-weight: 600;">
          <span>Taxable Value Adjusted</span>
          <span>₹900.00</span>
        </div>
        <div class="total-row tax-component">
          <span>Central GST Reversal (CGST @ 2.5%)</span>
          <span>-₹22.50</span>
        </div>
        <div class="total-row tax-component">
          <span>State GST Reversal (SGST @ 2.5%)</span>
          <span>-₹22.50</span>
        </div>
        <div class="total-row">
          <span>Integrated GST Reversal (IGST)</span>
          <span>₹0.00</span>
        </div>
        <div class="total-row grand">
          <span>TOTAL CREDIT AMOUNT</span>
          <span>₹945.00</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        Goods originally sold by <strong>Noor Saffron &amp; Spice Guild</strong> through the <strong>Siraba Organic</strong> marketplace platform.<br />
        Siraba Organic acts as an e-commerce facilitator / marketplace operator under Section 79 of the Information Technology Act. This Credit Note is issued on behalf of the supplier of goods under Section 34 of the CGST Act, 2017.
      </p>

      <div class="signatory-row">
        <div>
          Place: Pampore, J&amp;K<br />
          Date of Issue: 07/10/2026
        </div>
        <div style="text-align: right;">
          <div class="sig-line">
            Authorized Signatory<br />
            <span style="font-size: 8.5px; font-weight: 500; text-transform: none; color: #718096;">For Noor Saffron &amp; Spice Guild</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const pdf = await renderHtmlToPdf(htmlContent);
  const outPath = path.join(targetDir, '03_CREDIT_NOTE.pdf');
  fs.writeFileSync(outPath, pdf);
  console.log(`[Generated] 03_CREDIT_NOTE.pdf (${pdf.length} bytes)`);
}

// --------------------------------------------------------------------------
// 4. VENDOR SETTLEMENT STATEMENT (Platform -> Vendor)
// --------------------------------------------------------------------------
async function generateVendorSettlementStatementPdf() {
  const templatePath = path.join(__dirname, '../backend/templates/invoices/vendor-invoice-template.html');
  const templateContent = fs.readFileSync(templatePath, 'utf8');

  const data = {
    logoBase64,
    companyName: 'Noor Saffron & Spice Guild',
    companyAddress: 'Kashmir Saffron Park, Ladhoo Road',
    companyCity: 'Pampore, Jammu and Kashmir 192121',
    companyEmail: 'contact@noororganics.com',
    companyPhone: '+91 99066 11223',
    sellerGST: '01AAACN1234F1Z9',

    customerName: 'Bashir Ahmad Dar',
    customerAddress: 'House 14, Rajbagh',
    customerCity: 'Srinagar, 190008',
    customerCountry: 'India',
    customerPhone: '+91 94190 12345',

    invoiceNumber: 'VND-SETTLE/26-27/000001',
    invoiceDate: '05/10/2026',
    vendorOrderId: '67039a8c12b4e89f01234568',
    orderId: '67039a8c12b4e89f01234567',
    vendorOrderNumber: 'VO-99D4E2',
    orderNumber: '78A1B2C3',
    orderStatus: 'DELIVERED',
    paymentStatus: 'COMPLETED',
    shippingCarrier: 'Shiprocket Express',
    trackingNumber: 'SR-88491023',

    items: [
      {
        name: 'Super Negin Mongra Saffron 2g',
        sku: 'SAF-MNG-2G',
        hsn: '09102010',
        quantity: 1,
        price: '₹900.00',
        total: '₹900.00',
      },
    ],

    subtotal: '₹900.00',
    commissionRate: 10,
    platformCommission: '₹90.00',
    tax: '₹45.00',
    shipping: '₹50.00',
    netAmount: '₹810.00',
    grandTotal: '₹810.00',
  };

  const compiled = handlebars.compile(templateContent);
  const html = compiled(data);
  const pdf = await renderHtmlToPdf(html);
  const outPath = path.join(targetDir, '04_VENDOR_SETTLEMENT_STATEMENT.pdf');
  fs.writeFileSync(outPath, pdf);
  console.log(`[Generated] 04_VENDOR_SETTLEMENT_STATEMENT.pdf (${pdf.length} bytes)`);
}

async function main() {
  console.log('Generating CA-Ready sample PDFs for all 4 invoice/document types...\n');
  await generateCustomerTaxInvoicePdf();
  await generateSirabaCommissionInvoicePdf();
  await generateCreditNotePdf();
  await generateVendorSettlementStatementPdf();
  console.log('\nAll 4 PDFs generated successfully in:', targetDir);
}

main().catch((err) => {
  console.error('PDF Generation Failed:', err);
  process.exit(1);
});
