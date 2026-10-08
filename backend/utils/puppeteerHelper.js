const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

/**
 * Standard launch arguments for Linux containers (Render, Docker, etc.)
 */
function getPuppeteerLaunchArgs() {
  const isWindows = process.platform === "win32";
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-extensions",
  ];
  if (!isWindows) {
    args.push("--no-zygote", "--single-process");
  }
  return args;
}

/**
 * Locate candidate Chrome / Chromium executable paths across system and project directories
 */
function getCandidateExecutablePaths() {
  const candidates = [];

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    candidates.push(process.env.PUPPETEER_EXECUTABLE_PATH);
  }

  // System locations on Linux / Debian / Ubuntu / Render / Windows
  const systemPaths = [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  for (const sp of systemPaths) {
    if (fs.existsSync(sp)) {
      candidates.push(sp);
    }
  }

  // Search inside local project cache & user home cache
  const os = require("os");
  const localCacheDirs = [
    path.join(__dirname, "..", ".cache", "puppeteer", "chrome"),
    path.join(process.cwd(), ".cache", "puppeteer", "chrome"),
    path.join(os.homedir(), ".cache", "puppeteer", "chrome"),
    "/opt/render/.cache/puppeteer/chrome",
  ];

  for (const cacheBase of localCacheDirs) {
    if (fs.existsSync(cacheBase)) {
      try {
        const findBin = (dir) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const ent of entries) {
            const full = path.join(dir, ent.name);
            if (ent.isDirectory()) {
              const res = findBin(full);
              if (res) return res;
            } else if (
              ent.name === "chrome" ||
              ent.name === "chrome.exe" ||
              ent.name === "chromium"
            ) {
              return full;
            }
          }
          return null;
        };
        const found = findBin(cacheBase);
        if (found && !candidates.includes(found)) {
          candidates.push(found);
        }
      } catch (e) {
        // Ignore read errors
      }
    }
  }

  return candidates;
}

/**
 * Launch Puppeteer browser instance with automatic fallback resolution
 */
async function launchBrowser() {
  const args = getPuppeteerLaunchArgs();
  const candidatePaths = getCandidateExecutablePaths();

  // Try candidate paths first if found
  for (const execPath of candidatePaths) {
    try {
      if (fs.existsSync(execPath)) {
        const browser = await puppeteer.launch({
          headless: true,
          executablePath: execPath,
          args,
        });
        return browser;
      }
    } catch (err) {
      console.warn(`[puppeteerHelper] Failed to launch with candidate ${execPath}:`, err.message);
    }
  }

  // Fallback to default resolution (uses .puppeteerrc.cjs or default cache)
  return await puppeteer.launch({
    headless: true,
    args,
  });
}

/**
 * Pure JavaScript PDF Generator (conforms to PDF-1.4 specification)
 * Used as a 100% reliable fallback when headless Chrome is unavailable or restricted in cloud containers.
 * Generates valid multi-page A4 PDF documents with titles, page numbers, and crisp formatting.
 */
function buildPureJsPdf(title, textBlocks) {
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const LINE_HEIGHT = 14;
  const LINES_PER_PAGE = 46;

  const lines = [];
  for (const block of textBlocks) {
    if (typeof block === "string") {
      const split = block.split("\n");
      for (const s of split) {
        let remaining = s.trim();
        if (!remaining) {
          lines.push("");
          continue;
        }
        // Word wrap around 82 characters
        while (remaining.length > 82) {
          let cut = remaining.lastIndexOf(" ", 82);
          if (cut === -1) cut = 82;
          lines.push(remaining.substring(0, cut).trim());
          remaining = remaining.substring(cut).trim();
        }
        if (remaining) lines.push(remaining);
      }
    }
  }

  const pages = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + LINES_PER_PAGE));
  }
  if (pages.length === 0) pages.push(["(No content available)"]);

  const objects = [];
  function addObject(contentStr) {
    const objNum = objects.length + 1;
    objects.push({ num: objNum, content: contentStr });
    return objNum;
  }

  // 1: Catalog
  addObject("<< /Type /Catalog /Pages 2 0 R >>");
  // 2: Pages root placeholder
  const pagesObjIndex = objects.length;
  objects.push({ num: 2, content: "" });

  // 3: Font Regular (Helvetica)
  const fontReg = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  // 4: Font Bold (Helvetica-Bold)
  const fontBold = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  const pageObjNums = [];
  for (let p = 0; p < pages.length; p++) {
    const pageLines = pages[p];
    const streamOps = [];

    // Header title
    streamOps.push("BT");
    streamOps.push("/F2 10 Tf");
    streamOps.push("50 815 Td");
    const safeTitle = title.replace(/[\\()]/g, "");
    streamOps.push("(" + safeTitle + ") Tj");
    streamOps.push("/F1 8 Tf");
    streamOps.push("360 0 Td");
    streamOps.push("(Page " + (p + 1) + " of " + pages.length + ") Tj");
    streamOps.push("ET");

    // Divider line below header
    streamOps.push("0.5 w");
    streamOps.push("50 808 m 545 808 l S");

    // Body lines
    streamOps.push("BT");
    streamOps.push("/F1 9 Tf");
    streamOps.push("50 788 Td");
    streamOps.push(LINE_HEIGHT + " TL");

    for (let l = 0; l < pageLines.length; l++) {
      const line = pageLines[l];
      const safeLine = line
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
      streamOps.push("(" + safeLine + ") Tj");
      if (l < pageLines.length - 1) streamOps.push("T*");
    }
    streamOps.push("ET");

    const streamData = streamOps.join("\n");
    const streamLen = Buffer.byteLength(streamData, "utf8");
    const contentObjNum = addObject(
      "<< /Length " + streamLen + " >>\nstream\n" + streamData + "\nendstream"
    );

    const pageObjNum = addObject(
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " +
        PAGE_WIDTH +
        " " +
        PAGE_HEIGHT +
        "] " +
        "/Resources << /Font << /F1 " +
        fontReg +
        " 0 R /F2 " +
        fontBold +
        " 0 R >> >> " +
        "/Contents " +
        contentObjNum +
        " 0 R >>"
    );
    pageObjNums.push(pageObjNum);
  }

  // Populate Pages object
  objects[pagesObjIndex].content =
    "<< /Type /Pages /Kids [" +
    pageObjNums.map((n) => n + " 0 R").join(" ") +
    "] /Count " +
    pageObjNums.length +
    " >>";

  // Assemble PDF document bytes
  let offset = 0;
  const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  let pdf = header;
  offset += Buffer.byteLength(header, "utf8");

  const offsets = [];
  for (const obj of objects) {
    offsets.push(offset);
    const objStr = obj.num + " 0 obj\n" + obj.content + "\nendobj\n";
    pdf += objStr;
    offset += Buffer.byteLength(objStr, "utf8");
  }

  const startxref = offset;
  let xref = "xref\n0 " + (objects.length + 1) + "\n";
  xref += "0000000000 65535 f \n";
  for (const off of offsets) {
    xref += String(off).padStart(10, "0") + " 00000 n \n";
  }

  const trailer =
    "trailer\n<< /Size " +
    (objects.length + 1) +
    " /Root 1 0 R >>\nstartxref\n" +
    startxref +
    "\n%%EOF\n";
  pdf += xref + trailer;

  return Buffer.from(pdf, "utf8");
}

/**
 * Convert HTML document content to structured text blocks for pure-JS fallback PDF generator
 */
function htmlToTextBlocks(html, defaultTitle = "LEGAL AGREEMENT") {
  if (!html || typeof html !== "string") return [defaultTitle];

  // Strip scripts and styles
  let clean = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, (match) => {
      // keep header text
      return match.replace(/<[^>]+>/g, "\n");
    });

  // Extract headings and paragraphs with newlines
  clean = clean
    .replace(/<h[1-6][^>]*>/gi, "\n\n=== ")
    .replace(/<\/h[1-6]>/gi, " ===\n")
    .replace(/<p[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/li>/gi, "")
    .replace(/<tr[^>]*>/gi, "\n")
    .replace(/<td[^>]*>/gi, "  |  ")
    .replace(/<th[^>]*>/gi, "  |  ")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<hr\s*[\/]?>/gi, "\n------------------------------------------------------------\n")
    .replace(/<[^>]+>/g, ""); // strip remaining tags

  // Unescape common HTML entities
  clean = clean
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  const lines = clean.split("\n").map((l) => l.trimEnd());
  return lines;
}

// ── Concurrency Limiter for Headless PDF Rendering ──────────────────────────
let activePdfRenders = 0;
const MAX_CONCURRENT_PDF_RENDERS = 2;
const RENDER_TIMEOUT_MS = 25000;

async function acquirePdfRenderSlot() {
  const startTime = Date.now();
  while (activePdfRenders >= MAX_CONCURRENT_PDF_RENDERS) {
    if (Date.now() - startTime > 10000) {
      throw new Error("PDF render queue full. Server busy, please retry in a moment.");
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  activePdfRenders++;
}

function releasePdfRenderSlot() {
  if (activePdfRenders > 0) activePdfRenders--;
}

/**
 * Safely render HTML to PDF buffer with concurrency limiting and guaranteed resource cleanup.
 */
async function renderHtmlToPdf(html, options = {}) {
  await acquirePdfRenderSlot();
  let browser = null;
  let page = null;
  try {
    browser = await launchBrowser();
    page = await browser.newPage();
    page.setDefaultTimeout(RENDER_TIMEOUT_MS);

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: RENDER_TIMEOUT_MS,
    });

    const pdfBuffer = await page.pdf({
      format: options.format || "A4",
      printBackground: true,
      margin: options.margin || {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm",
      },
      preferCSSPageSize: true,
    });

    return pdfBuffer;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    releasePdfRenderSlot();
  }
}

module.exports = {
  launchBrowser,
  getPuppeteerLaunchArgs,
  buildPureJsPdf,
  htmlToTextBlocks,
  renderHtmlToPdf,
};
