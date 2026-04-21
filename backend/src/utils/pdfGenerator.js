"use strict";

const PDFDocument = require("pdfkit");
const path = require("path");

// ─────────────────────────────────────────────────────────────────────────────
//  Page geometry
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 48; // left / right margin
const CW = PAGE_W - M * 2; // usable content width
const FOOTER_H = 28; // footer bar height
const BODY_BOT = PAGE_H - FOOTER_H - 8; // lowest safe Y for content
const COVER_LOGO = path.join(__dirname, "..", "images", "SSlogo.png");
const PAGE_LOGO = path.join(__dirname, "..", "images", "SSletterLOGO.png");

// ─────────────────────────────────────────────────────────────────────────────
//  Palette  (mirrors the HTML template colours exactly)
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  brand: "#2b2bb2", // primary blue
  brandDark: "#1f1f8a", // header border / darker blue
  sky: "#38bdf8", // sky-400 — subtitle accent
  skyDark: "#0ea5e9", // sky-500
  white: "#ffffff",
  offWhite: "#f9fafb", // gray-50 (alt row bg)
  grayAlt: "#f3f4f6", // gray-100 (lighter alt bg)
  grayBorder: "#d1d5db", // gray-300 table border
  grayLight: "#e5e7eb", // gray-200
  grayMid: "#6b7280", // gray-500
  grayDark: "#374151", // gray-700  (body text)
  bodyText: "#1f2937", // gray-800
  // Severity — richer pill colours matching the reference design
  red: "#b91c1c", // red-700  (darker, more contrast)
  redBg: "#fecaca", // red-200  (warm pink pill bg)
  orange: "#c2410c", // orange-700
  orangeBg: "#fed7aa", // orange-200 (warm peach pill bg)
  yellowDark: "#78350f", // amber-900 (dark olive)
  yellowBg: "#fef08a", // yellow-200 (bright yellow pill bg)
  blue: "#1d4ed8",
  blueBg: "#bfdbfe", // blue-200  (pill bg)
  green: "#166534", // green-800 (darker)
  greenBg: "#bbf7d0", // green-200 (bright green pill bg)
};

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const sevColor = (s) =>
  ({
    critical: C.red,
    high: C.orange,
    medium: C.yellowDark,
    low: C.green,
  })[(s || "").toLowerCase()] || C.grayMid;

const sevBg = (s) =>
  ({
    critical: C.redBg,
    high: C.orangeBg,
    medium: C.yellowBg,
    low: C.greenBg,
  })[(s || "").toLowerCase()] || C.offWhite;

// Draw a pill-shaped severity badge (rounded rect + bold centred text)
const drawSeverityBadge = (doc, val, cx, cy, colWidth, rowHeight) => {
  const label = String(val).toUpperCase();
  const sev = label.toLowerCase();
  const fg = sevColor(sev);
  const bg = sevBg(sev);
  const pillW = Math.min(colWidth - 10, 72);
  const pillH = 14;
  const pillX = cx + (colWidth - pillW) / 2;
  const pillY = cy + (rowHeight - pillH) / 2;
  // Rounded rectangle pill
  doc
    .save()
    .fillColor(bg)
    .roundedRect(pillX, pillY, pillW, pillH, pillH / 2)
    .fill()
    .restore();
  // Bold centred label
  doc.x = pillX;
  doc.y = pillY + 2;
  doc
    .fillColor(fg)
    .font("Helvetica-Bold")
    .fontSize(7)
    .text(label, { width: pillW, align: "center", lineBreak: false });
};

// Raw rectangle fills / strokes
const fillRect = (doc, x, y, w, h, color) =>
  doc.save().fillColor(color).rect(x, y, w, h).fill().restore();

const strokeRect = (doc, x, y, w, h, color = C.grayBorder, lw = 0.5) =>
  doc
    .save()
    .strokeColor(color)
    .lineWidth(lw)
    .rect(x, y, w, h)
    .stroke()
    .restore();

// ─────────────────────────────────────────────────────────────────────────────
//  Page chrome — footer bar + page number (called once per interior page)
// ─────────────────────────────────────────────────────────────────────────────
let _pageNum = 0;

const drawFooter = (doc) => {
  _pageNum++;
  fillRect(doc, 0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H, C.brand);

  // doc
  //   .fillColor(C.white)
  //   .font("Helvetica")
  //   .fontSize(7)
  //   .text(
  //     "SBOM Analysis Report - Shieldersoft Technologies Private Limited - Confidential",
  //     M,
  //     PAGE_H - FOOTER_H + 9,
  //     { width: CW - 30, align: "left", lineBreak: false },
  //   );

  doc
    .fillColor(C.white)
    .font("Helvetica")
    .fontSize(7)
    .text(
      "SBOM Analysis Report - Shieldersoft Technologies Private Limited - Confidential",
      M,
      PAGE_H - FOOTER_H + 9,
      {
        width: CW - 30,
        align: "left",
        lineBreak: false,
        characterSpacing: 0.5, // adjust (e.g., 0.3–1) for subtle spacing
      },
    );

  doc
    .fillColor(C.white)
    .font("Helvetica-Bold")
    .fontSize(7)
    .text(`Page ${_pageNum}`, M, PAGE_H - FOOTER_H + 9, {
      width: CW,
      align: "right",
      lineBreak: false,
    });
};

const drawLogo = (doc, imagePath, x, y, width) => {
  doc.image(imagePath, x, y, { width });
};

// Add a fresh interior page (thin top bar + footer) and return starting Y
const addPage = (doc) => {
  doc.addPage();
  // Very thin top accent line (matches the accent bar feel without consuming space)
  fillRect(doc, 0, 0, PAGE_W, 4, C.brand);
  drawLogo(doc, PAGE_LOGO, PAGE_W - M - 78, 14, 78);
  drawFooter(doc);
  // CRITICAL: reset cursor to top of content area.
  // drawFooter() moves doc.y to the bottom (~820). If we then try to render
  // text at an explicit Y near the top (e.g. 62), PDFKit treats it as a
  // "backwards" move and auto-inserts another page, causing cascading blank pages.
  const startY = M + 14;
  doc.x = M;
  doc.y = startY;
  return startY;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Section heading — large blue text + blue rule underneath
// ─────────────────────────────────────────────────────────────────────────────
const sectionTitle = (doc, text, y) => {
  doc
    .fillColor(C.brand)
    .font("Helvetica-Bold")
    .fontSize(18)
    .text(text, M, y, { width: CW });
  const lineY = y + 26;
  fillRect(doc, M, lineY, CW, 2, C.brand);
  return lineY + 10;
};

// Sub-heading (smaller, uppercase, brand blue, no rule)
const subHeading = (doc, text, y) => {
  doc
    .fillColor(C.brand)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text(text.toUpperCase(), M, y, {
      width: CW,
      characterSpacing: 0.5,
    });
  return doc.y + 6;
};

// Body paragraph
const para = (doc, text, y, indent = 0) => {
  doc
    .fillColor(C.grayDark)
    .font("Helvetica")
    .fontSize(9)
    .lineGap(3)
    .text(text, M + indent, y, { width: CW - indent });
  return doc.y + 10;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Two-column key-value table
// ─────────────────────────────────────────────────────────────────────────────
const kvTable = (doc, rows, startY, col1W = 170) => {
  const col2W = CW - col1W;
  const ROW_H = 21;
  let y = startY;

  rows.forEach(([label, value], i) => {
    const bg = i % 2 === 0 ? C.white : C.offWhite;

    // Outline the full row
    fillRect(doc, M, y, CW, ROW_H, bg);
    strokeRect(doc, M, y, CW, ROW_H, C.grayBorder);

    // Column 1 — blue bold label
    doc
      .fillColor(C.brand)
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(String(label), M + 6, y + 6, {
        width: col1W - 10,
        lineBreak: false,
      });

    // Column 2 — dark body value
    doc
      .fillColor(C.bodyText)
      .font("Helvetica")
      .fontSize(8.5)
      .text(String(value ?? "—"), M + col1W + 6, y + 6, {
        width: col2W - 12,
        lineBreak: false,
        ellipsis: true,
      });

    y += ROW_H;
  });

  return y + 8;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Generic multi-column data table — blue header, alternating rows, auto-break
//  cols: [{ label, width, bold?, color(string|fn)?, align? }]
// ─────────────────────────────────────────────────────────────────────────────
const dataTable = (doc, cols, rows, startY) => {
  const HEADER_H = 23;
  const ROW_H = 19;

  // Proportionally scale column widths if table would exceed content width
  const totalDef = cols.reduce((s, c) => s + c.width, 0);
  const scale = Math.min(1, CW / totalDef);
  const scaled = cols.map((c) => ({
    ...c,
    width: Math.floor(c.width * scale),
  }));
  const tableW = scaled.reduce((s, c) => s + c.width, 0);

  // Draw the blue header row for the table.
  // IMPORTANT: we pre-position doc.x/doc.y before each cell and call
  // doc.text() WITHOUT explicit y coordinates.  Passing an explicit y that
  // is less than the current doc.y causes PDFKit to auto-insert a new page,
  // which is what produces the "one row per page" bug on continuation pages.
  const drawHeader = (ty) => {
    fillRect(doc, M, ty, tableW, HEADER_H, C.brand);
    strokeRect(doc, M, ty, tableW, HEADER_H, C.brandDark, 1);

    let cx = M;
    scaled.forEach((c) => {
      // Pre-position — no explicit y passed to .text()
      doc.x = cx + 5;
      doc.y = ty + 8;
      doc
        .fillColor(C.white)
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text(c.label, {
          width: c.width - 10,
          lineBreak: false,
          ellipsis: true,
          align: c.align || "left",
        });
      cx += c.width;
    });
    // Restore x to margin and move y past the header band
    doc.x = M;
    doc.y = ty + HEADER_H;
    return ty + HEADER_H;
  };

  let y = drawHeader(startY);

  rows.forEach((row, ri) => {
    if (y + ROW_H > BODY_BOT) {
      doc.addPage();
      fillRect(doc, 0, 0, PAGE_W, 4, C.brand);
      drawFooter(doc);
      // Fully reset the PDFKit cursor to the top of the content area
      // BEFORE calling drawHeader, so none of the header's pre-positioned
      // text calls see a backwards y and trigger another auto-page.
      doc.x = M;
      doc.y = M + 14;
      y = M + 14;
      y = drawHeader(y);
    }

    const bg = ri % 2 === 0 ? C.white : C.offWhite;
    fillRect(doc, M, y, tableW, ROW_H, bg);
    strokeRect(doc, M, y, tableW, ROW_H, C.grayBorder);

    let cx = M;
    scaled.forEach((col, ci) => {
      const val = row[ci] ?? "—";

      // Badge column — draw a coloured pill instead of plain text
      if (col.badge) {
        drawSeverityBadge(doc, val, cx, y, col.width, ROW_H);
        // keep cursor in sync without advancing y
        doc.x = cx + col.width;
        doc.y = y + 6;
        cx += col.width;
        return;
      }

      let color = C.grayDark;
      if (typeof col.color === "function") color = col.color(val, row);
      else if (col.color) color = col.color;

      // Pre-position — no explicit y passed to .text() to avoid
      // backwards-y auto-page triggers when rendering multi-column rows.
      doc.x = cx + 5;
      doc.y = y + 6;
      doc
        .fillColor(color)
        .font(col.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(7.5)
        .text(String(val), {
          width: col.width - 10,
          lineBreak: false,
          ellipsis: true,
          align: col.align || "left",
        });
      cx += col.width;
    });

    // Advance y by the fixed row height (not by whatever PDFKit set doc.y to)
    y += ROW_H;
    doc.x = M;
    doc.y = y; // keep PDFKit cursor in sync with our y tracker
  });

  return y + 8;
};

// ─────────────────────────────────────────────────────────────────────────────
//  Info-box  (coloured panel with left accent bar)
// ─────────────────────────────────────────────────────────────────────────────
const infoBox = (doc, text, y, color = C.brand, bg = "#eef2ff") => {
  const boxW = CW;
  const boxH = 36;
  fillRect(doc, M, y, boxW, boxH, bg);
  strokeRect(doc, M, y, boxW, boxH, color, 0.8);
  fillRect(doc, M, y, 4, boxH, color);
  doc
    .fillColor(C.grayDark)
    .font("Helvetica")
    .fontSize(8.5)
    .lineGap(2)
    .text(text, M + 12, y + 10, { width: boxW - 18, lineBreak: false });
  return y + boxH + 8;
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN  GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
const generateScanPDF = (scan, report) => {
  _pageNum = 0;

  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    info: {
      Title: `SBOM Report — ${scan.filename || "Unknown"}`,
      Author: "Shieldersoft Technologies Private Limited",
      Subject: "SBOM Security Analysis Report",
      Creator: "SBOM Platform v1.0",
      Keywords: "SBOM, vulnerability, security",
    },
  });

  const components = report?.components || [];
  const vulnerabilities = report?.vulnerabilities || [];
  const summary = report?.summary || {};

  const orgName =
    scan.organization && typeof scan.organization === "object"
      ? scan.organization.name || "—"
      : scan.organization || "—";

  const vulnCritical = scan.vulnCritical ?? summary.critical ?? 0;
  const vulnHigh = scan.vulnHigh ?? summary.high ?? 0;
  const vulnMedium = scan.vulnMedium ?? summary.medium ?? 0;
  const vulnLow = scan.vulnLow ?? summary.low ?? 0;
  const vulnTotal =
    vulnCritical + vulnHigh + vulnMedium + vulnLow ||
    vulnerabilities.length ||
    summary.totalVulnerabilities ||
    0;

  // ═══════════════════════════════════════════════════════════ 1. COVER PAGE
  _pageNum++; // cover = page 1, no printed number

  // Left accent sidebar — 8 pt wide, full page height (matches HTML w-2)
  fillRect(doc, 0, 0, 8, PAGE_H, C.brand);

  // Decorative right-side curve  (matches HTML SVG <path d="M0,0 Q400,400 0,800">)
  doc
    .save()
    .strokeColor(C.brand)
    .opacity(0.04)
    .lineWidth(60)
    .moveTo(PAGE_W, 0)
    .bezierCurveTo(
      PAGE_W - 250,
      PAGE_H * 0.3,
      PAGE_W - 100,
      PAGE_H * 0.7,
      PAGE_W,
      PAGE_H,
    )
    .stroke()
    .restore();

  doc
    .save()
    .strokeColor(C.skyDark)
    .opacity(0.05)
    .lineWidth(40)
    .moveTo(PAGE_W, 0)
    .bezierCurveTo(
      PAGE_W - 150,
      PAGE_H * 0.4,
      PAGE_W - 250,
      PAGE_H * 0.6,
      PAGE_W - 50,
      PAGE_H,
    )
    .stroke()
    .restore();

  doc
    .save()
    .strokeColor(C.brandDark)
    .opacity(0.03)
    .lineWidth(80)
    .moveTo(PAGE_W, 0)
    .bezierCurveTo(
      PAGE_W - 350,
      PAGE_H * 0.5,
      PAGE_W - 50,
      PAGE_H * 0.8,
      PAGE_W,
      PAGE_H,
    )
    .stroke()
    .restore();

  // Small "SECURITY REPORT" eyebrow label
  const X0 = 26; // content left edge (right of sidebar)
  drawLogo(doc, COVER_LOGO, X0, 42, 112);
  const coverTitleX = 75;
  const coverTitleY = 320;
  const coverTitleW = 380;

  // Left thick accent bar on the title block
  fillRect(doc, coverTitleX - 16, coverTitleY - 6, 4, 160, C.brandDark);

  // Thin rule above the title extending from the left bar
  fillRect(
    doc,
    coverTitleX - 16,
    coverTitleY - 6,
    coverTitleW - 60,
    1.5,
    C.brandDark,
  );

  doc
    .fillColor(C.brandDark)
    .font("Helvetica-Bold")
    .fontSize(40)
    .text("SOFTWARE BILL", coverTitleX, coverTitleY + 4, {
      width: coverTitleW,
      align: "left",
      lineGap: 1,
    });

  doc
    .fillColor(C.brandDark)
    .font("Helvetica-Bold")
    .fontSize(40)
    .text("OF MATERIALS", coverTitleX, coverTitleY + 54, {
      width: coverTitleW,
      align: "left",
      lineGap: 1,
    });

  // Thin separator between heading and subtitle
  fillRect(
    doc,
    coverTitleX - 16,
    coverTitleY + 104,
    coverTitleW - 60,
    1.5,
    C.brandDark,
  );

  doc
    .fillColor(C.skyDark)
    .font("Helvetica-Bold")
    .fontSize(40)
    .text("REPORT", coverTitleX, coverTitleY + 114, {
      width: coverTitleW,
      align: "left",
      lineGap: 1,
    });

  doc
    .fillColor(C.brand)
    .font("Helvetica")
    .fontSize(9)
    .text(fmtDate(scan.completedAt || new Date()), X0, PAGE_H - 112, {
      width: 170,
      align: "left",
      lineBreak: false,
    });

  doc
    .fillColor(C.brand)
    .font("Helvetica")
    .fontSize(9)
    .text("+91 9211770600", X0, PAGE_H - 98, {
      width: 170,
      align: "left",
      lineBreak: false,
    });

  doc
    .fillColor(C.brand)
    .font("Helvetica")
    .fontSize(9)
    .text("www.shieldersoft.io", X0, PAGE_H - 84, {
      width: 170,
      align: "left",
      lineBreak: false,
    });

  doc
    .fillColor(C.brand)
    .font("Helvetica")
    .fontSize(9)
    .text("sales@shieldersoft.io", X0, PAGE_H - 70, {
      width: 170,
      align: "left",
      lineBreak: false,
    });

  // ═══════════════════════════════════════════════════════ 2. INDEX / TOC ══
  let y = addPage(doc);
  y = sectionTitle(doc, "Index", y);

  const tocSections = [
    "Document Control",
    "Background & Context",
    "The Prologue",
    "Executive Summary",
    "Approach & Methodology",
    "Vulnerability Details",
    "Technical Summary",
    "The Epilogue",
  ];

  // Column widths: # | Section | Page
  y = dataTable(
    doc,
    [
      { label: "#", width: 36, align: "center", color: C.brand, bold: true },
      { label: "Section", width: CW - 36 - 80 },
      { label: "Page", width: 80, align: "center", color: C.grayMid },
    ],
    tocSections.map((title, i) => [i + 1, title, "—"]),
    y,
  );

  // ════════════════════════════════════════════ 3. DOCUMENT CONTROL ════════
  y = addPage(doc);
  y = sectionTitle(doc, "Document Control", y);

  y = kvTable(
    doc,
    [
      ["Document Title", "SBOM Analysis Report \u2014 v1.0"],
      ["Document Version", "v \u2014 1.0"],
      ["Report Type", "SBOM"],
      ["Classification", "Confidential"],
      [
        "Prepared By",
        "Shieldersoft Technologies Private Limited \u2014 Automated SBOM Analysis Engine",
      ],
      ["Prepared For", orgName],
      ["Scan File", scan.filename || "\u2014"],
      ["Scan ID", scan._id ? scan._id.toString() : "\u2014"],
      ["Scan Type", (scan.scanType || "\u2014").toUpperCase()],
      ["Scan Started", fmtDate(scan.startedAt)],
      ["Scan Completed", fmtDate(scan.completedAt)],
      ["Format", (scan.format || "CycloneDX").toUpperCase()],
      ["Status", (scan.status || "\u2014").toUpperCase()],
    ],
    y,
  );

  // ══════════════════════════════════════ 4. BACKGROUND & CONTEXT ══════════
  y = addPage(doc);
  y = sectionTitle(doc, "Background & Context", y);

  y = para(
    doc,
    "Modern software development stacks are drowning in third-party dependencies. Every build pulls in hundreds—sometimes thousands—of external components: open-source libraries, transitive packages, container layers, build plugins, and framework extensions. This dependency chain is now one of the most common entry points for large-scale compromises. Supply-chain attacks like Log4Shell, SolarWinds, XZ backdoor, and dependency-confusion incidents proved that you don’t need a bug in your code to get breached—an outdated or compromised dependency is enough to take down the entire system.\n" +
      "Engineering teams typically have no visibility into these components. Most projects don’t maintain an SBOM, rarely track library updates, and almost never monitor risk across repositories. The result: unknown attack surface, blind trust in external code, and silent vulnerabilities living deep inside production workloads.\n" +
      "This tool was built to eliminate that blindness",
    y,
  );

  y = dataTable(
    doc,
    [
      { label: "Capability", width: 160, bold: true },
      { label: "Description", width: CW - 160 },
    ],
    [
      [
        "Dependency Mapping",
        "Identifies every direct and transitive package used in the project.",
      ],
      [
        "Vulnerability Correlation",
        "Correlates components against CVE, NVD, and vendor advisory feeds.",
      ],
      [
        "License Compliance",
        "Flags components with restrictive or incompatible license terms.",
      ],
      [
        "Outdated Component Detection",
        "Highlights packages with available security patches.",
      ],
      [
        "Exploit Tracking",
        "Identifies components with known public exploits (EPSS / CISA KEV).",
      ],
      [
        "SBOM Analysis",
        "Maps cryptographic primitives and cipher usage within source code.",
      ],
    ],
    y,
  );

  // ═════════════════════════════════════════════════ 5. THE PROLOGUE ═══════
  y = addPage(doc);
  y = sectionTitle(doc, "The Prologue", y);

  y = para(
    doc,
    "Modern software depends heavily on external libraries, frameworks, and hidden transitive packages. " +
      "While these components accelerate development, they also introduce risks that are invisible without " +
      "automated analysis — outdated versions, unpatched CVEs, restrictive licenses, and code patterns that " +
      "signal deeper architectural vulnerabilities.",
    y,
  );

  doc
    .fillColor(C.brand)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("Why This Matters:", M, y, { continued: true });
  doc
    .fillColor(C.grayDark)
    .font("Helvetica")
    .fontSize(9)
    .text(
      "  A secure application is impossible to maintain without knowing exactly what " +
        "components it depends on and how the internal code behaves under analysis. This report " +
        "draws a complete map of that landscape.",
    );
  y = doc.y + 12;

  y = dataTable(
    doc,
    [
      { label: "Risk Category", width: 160, bold: true },
      { label: "Impact", width: 200 },
      {
        label: "Priority",
        width: CW - 360,
        align: "center",
        bold: true,
        color: (v) =>
          v === "Critical" ? C.red : v === "High" ? C.orange : C.yellowDark,
      },
    ],
    [
      [
        "Vulnerable Dependencies",
        "Remote code execution, data exfiltration",
        "Critical",
      ],
      ["Outdated Libraries", "Exposure to known unpatched CVEs", "High"],
      [
        "Transitive Risks",
        "Indirect vulnerabilities via nested packages",
        "High",
      ],
      ["License Violations", "Legal and compliance exposure", "Medium"],
      [
        "Cryptographic Weaknesses",
        "Weak cipher suites, deprecated algorithms",
        "Medium",
      ],
      [
        "Configuration Exposure",
        "Hardcoded secrets, insecure defaults",
        "High",
      ],
    ],
    y,
  );

  // ══════════════════════════════════════════ 6. EXECUTIVE SUMMARY ═════════
  y = addPage(doc);
  y = sectionTitle(doc, "Executive Summary", y);

  y = para(
    doc,
    "This assessment provides a point-in-time view of the project's dependency risks and internal code " +
      "exposures. The scan identifies vulnerable components, outdated packages, security-sensitive files, " +
      "and configuration issues requiring remediation.",
    y,
  );

  // ── Severity cards (4 across) ──────────────────────────────────────────
  const sevCards = [
    { label: "CRITICAL", count: vulnCritical, textColor: C.red, bg: C.redBg },
    { label: "HIGH", count: vulnHigh, textColor: C.orange, bg: C.orangeBg },
    {
      label: "MEDIUM",
      count: vulnMedium,
      textColor: C.yellowDark,
      bg: C.yellowBg,
    },
    { label: "LOW", count: vulnLow, textColor: C.blue, bg: C.blueBg },
  ];
  const cardW = Math.floor((CW - 18) / 4);
  const cardH = 70;

  sevCards.forEach((card, i) => {
    const cx = M + i * (cardW + 6);
    fillRect(doc, cx, y, cardW, cardH, card.bg);
    strokeRect(doc, cx, y, cardW, cardH, card.textColor, 1);
    fillRect(doc, cx, y, 4, cardH, card.textColor);
    doc
      .fillColor(card.textColor)
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .text(card.label, cx + 10, y + 11, {
        width: cardW - 14,
        lineBreak: false,
      });
    doc
      .fillColor(card.textColor)
      .font("Helvetica-Bold")
      .fontSize(28)
      .text(String(card.count), cx + 10, y + 28, {
        width: cardW - 14,
        lineBreak: false,
      });
  });
  y += cardH + 16;

  // ── Scan Metadata sub-table ────────────────────────────────────────────
  y = subHeading(doc, "Scan Metadata", y);
  y = kvTable(
    doc,
    [
      ["Scan ID", scan._id ? scan._id.toString() : "\u2014"],
      ["Target File", scan.filename || "\u2014"],
      ["Scan Type", (scan.scanType || "\u2014").toUpperCase()],
      ["Scan Started", fmtDate(scan.startedAt)],
      ["Scan Completed", fmtDate(scan.completedAt)],
      ["Format", (scan.format || "CycloneDX").toUpperCase()],
      ["Report Type", "SBOM"],
      ["Organization", orgName],
    ],
    y,
  );

  // ── Component summary sub-table ────────────────────────────────────────
  if (y + 60 > BODY_BOT) {
    y = addPage(doc);
  }
  y = subHeading(doc, "Component Summary", y);
  y = kvTable(
    doc,
    [
      [
        "Total Components",
        String(components.length || summary.totalComponents || 0),
      ],
      [
        "Vulnerable Components",
        String(components.filter((c) => c.vulnerable).length),
      ],
      [
        "Outdated Libraries",
        String(components.filter((c) => c.outdated).length),
      ],
      [
        "Components with Exploits",
        String(components.filter((c) => c.exploit).length),
      ],
    ],
    y,
  );

  // ── Severity breakdown sub-table ───────────────────────────────────────
  if (y + 80 > BODY_BOT) {
    y = addPage(doc);
  }
  y = subHeading(doc, "Vulnerability Severity Breakdown", y);
  y = dataTable(
    doc,
    [
      { label: "Severity", width: 110, badge: true },
      {
        label: "Count",
        width: 60,
        align: "center",
        bold: true,
        color: (v, row) => sevColor(row[0].toLowerCase()),
      },
      { label: "Description", width: CW - 170 },
    ],
    [
      [
        "CRITICAL",
        vulnCritical,
        "Immediate exploitation risk; patch or isolate urgently.",
      ],
      [
        "HIGH",
        vulnHigh,
        "High-impact vulnerabilities requiring prompt remediation.",
      ],
      [
        "MEDIUM",
        vulnMedium,
        "Notable risk; address within standard patch cycle.",
      ],
      ["LOW", vulnLow, "Minimal risk; address in next scheduled maintenance."],
    ],
    y,
  );

  // ════════════════════════════════════ 7. APPROACH & METHODOLOGY ══════════
  y = addPage(doc);
  y = sectionTitle(doc, "Approach & Methodology", y);

  y = para(
    doc,
    "The BOM analysis engine follows a structured, multi-phase methodology to ensure complete coverage " +
      "of both open-source dependencies and internal code patterns.",
    y,
  );

  y = dataTable(
    doc,
    [
      {
        label: "Phase",
        width: 42,
        align: "center",
        bold: true,
        color: C.brand,
      },
      { label: "Activity", width: 140, bold: true },
      { label: "Description", width: CW - 42 - 140 - 120 },
      { label: "Tool / Source", width: 120, color: C.grayMid },
    ],
    [
      [
        "1",
        "Ingestion",
        "Parse uploaded package manifest or SBOM file.",
        "CycloneDX / SPDX",
      ],
      [
        "2",
        "Component Extraction",
        "Extract all direct and transitive dependency metadata.",
        "BOM Engine",
      ],
      [
        "3",
        "Vulnerability Lookup",
        "Cross-reference components against CVE / NVD / OSV databases.",
        "NVD, OSV, GHSA",
      ],
      [
        "4",
        "Exploit Mapping",
        "Check for known public exploits via EPSS and CISA KEV.",
        "CISA KEV, EPSS",
      ],
      [
        "5",
        "Outdated Detection",
        "Compare installed versions against latest stable releases.",
        "Package Registries",
      ],
      [
        "6",
        "SBOM Analysis",
        "Identify cryptographic algorithm usage in the source tree.",
        "Static Analysis",
      ],
      [
        "7",
        "Report Generation",
        "Compile findings into structured SBOM report.",
        "Internal Engine",
      ],
    ],
    y,
  );

  // ══════════════════════════════════════ 8. VULNERABILITY DETAILS ══════════
  y = addPage(doc);
  y = sectionTitle(doc, "Vulnerability Details", y);

  y = para(
    doc,
    `The following table lists all ${vulnerabilities.length} ` +
      `vulnerabilit${vulnerabilities.length !== 1 ? "ies" : "y"} identified during this scan, ` +
      "including CVE identifiers, affected packages, severity ratings, and recommended fix versions.",
    y,
  );

  if (vulnerabilities.length === 0) {
    fillRect(doc, M, y, CW, 46, C.greenBg);
    strokeRect(doc, M, y, CW, 46, C.green, 1);
    fillRect(doc, M, y, 4, 46, C.green);
    doc
      .fillColor(C.green)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("No vulnerabilities detected in this scan.", M + 14, y + 16, {
        width: CW - 24,
      });
    y += 56;
  } else {
    y = dataTable(
      doc,
      [
        { label: "#", width: 28, align: "center", color: C.grayMid },
        { label: "CVE / ID", width: 110, bold: true, color: C.brand },
        { label: "Severity", width: 76, badge: true },
        { label: "Package", width: 100, bold: true },
        { label: "Version", width: 62, color: C.grayMid },
        { label: "Fixed In", width: 62, color: C.green },
        { label: "Description", width: CW - 28 - 110 - 76 - 100 - 62 - 62 },
      ],
      vulnerabilities.map((v, i) => [
        i + 1,
        v.cve || "\u2014",
        (v.severity || "unknown").toUpperCase(),
        v.package || "\u2014",
        v.version || "\u2014",
        v.fixedVersion || "\u2014",
        // v.description
        //     ? (v.description.length > 70 ? v.description.slice(0, 70) + '\u2026' : v.description)
        //     : '\u2014',
      ]),
      y,
    );
  }

  // ═══════════════════════════════════════ 9. TECHNICAL SUMMARY ════════════
  if (y + 80 > BODY_BOT) {
    y = addPage(doc);
  } else {
    y += 4;
    fillRect(doc, M, y, CW, 1, C.grayLight); // subtle divider
    y += 10;
  }
  y = sectionTitle(doc, "Technical Summary \u2014 Components", y);

  y = para(
    doc,
    `All ${components.length} component${components.length !== 1 ? "s" : ""} detected during the scan ` +
      "are listed below with full metadata including vulnerability and exploit status.",
    y,
  );

  if (components.length === 0) {
    doc
      .fillColor(C.grayMid)
      .font("Helvetica")
      .fontSize(9)
      .text("No components were detected in this scan.", M, y, { width: CW });
    y = doc.y + 14;
  } else {
    y = dataTable(
      doc,
      [
        { label: "#", width: 28, align: "center", color: C.grayMid },
        { label: "Name", width: 140, bold: true },
        { label: "Version", width: 78, color: C.grayMid },
        { label: "Type", width: 74 },
        { label: "Group", width: 96 },
        { label: "Scope", width: CW - 28 - 140 - 78 - 74 - 96 },
      ],
      components.map((c, i) => [
        i + 1,
        c.name || "\u2014",
        c.version || "\u2014",
        c.type || "\u2014",
        c.group || "\u2014",
        c.scope || "\u2014",
      ]),
      y,
    );
  }

  // ══════════════════════════════════════════════ 10. THE EPILOGUE ══════════
  // y = addPage(doc);
  // y = sectionTitle(doc, 'The Epilogue', y);

  // y = para(doc,
  //     'This report provides a precise, point-in-time view of the project\'s internal and external risks. ' +
  //     'By mapping every dependency, identifying known vulnerabilities, analyzing code structures, and ' +
  //     'exposing configuration weaknesses, this assessment helps teams reduce uncertainty and address issues ' +
  //     'before they translate into operational impact.',
  // y);

  // y = para(doc,
  //     'Security is not a destination but a continuous process. We recommend scheduling recurring SBOM scans ' +
  //     'at every release cycle, integrating BOM generation into CI/CD pipelines, and establishing a formal ' +
  //     'vulnerability management workflow to remediate findings based on severity and exploitability.',
  // y);

  // // Recommendations box
  // y += 4;
  // const recRows = [
  //     ['Immediate',   'Patch or isolate all CRITICAL and HIGH severity vulnerabilities without delay.'],
  //     ['Short-Term',  'Address MEDIUM vulnerabilities within the current sprint or patch cycle.'],
  //     ['Ongoing',     'Integrate SBOM generation into your CI/CD pipeline for continuous visibility.'],
  //     ['Governance',  'Establish a formal vulnerability management policy with SLA-based remediation targets.'],
  // ];
  // y = dataTable(doc, [
  //     { label: 'Timeline',        width: 100, bold: true, color: C.brand },
  //     { label: 'Recommendation',  width: CW - 100 },
  // ], recRows, y);

  // ══════════════════════════════════════════════ EPILOGUE PAGE ════════════
  y = addPage(doc);

  // Top decorative wave background
  doc.save().strokeColor("#d1d5db").lineWidth(0.8).opacity(0.7);

  for (let i = 0; i < 10; i++) {
    doc
      .moveTo(0, 25 + i * 7)
      .bezierCurveTo(180, -20 + i * 7, 420, 120 + i * 7, PAGE_W, 40 + i * 7)
      .stroke();
  }
  doc.restore();

  // Bottom decorative wave background
  doc.save().strokeColor("#d1d5db").lineWidth(0.8).opacity(0.5);

  for (let i = 0; i < 8; i++) {
    doc
      .moveTo(0, PAGE_H - 80 + i * 5)
      .bezierCurveTo(
        140,
        PAGE_H - 120 + i * 5,
        420,
        PAGE_H - 20 + i * 5,
        PAGE_W,
        PAGE_H - 80 + i * 5,
      )
      .stroke();
  }
  doc.restore();

  // Small top-right logo placeholder
  doc
    .fillColor(C.brand)
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("", PAGE_W - 85, 82);

  // Title
  doc
    .fillColor(C.brand)
    .font("Helvetica-Oblique")
    .fontSize(28)
    .text("The Epilogue", M + 20, 150);

  // Body Text Block
  doc
    .fillColor(C.grayDark)
    .font("Helvetica-Oblique")
    .fontSize(10.5)
    .lineGap(5)
    .text(
      "This report provides a precise, point-in-time view of the project’s internal and external " +
        "risks. By mapping every dependency, identifying known vulnerabilities, analyzing code " +
        "structures, and exposing configuration weaknesses, this assessment helps teams reduce " +
        "uncertainty and address issues before they translate into operational impact. Clear " +
        "visibility into the software’s makeup is the first step toward strong supply-chain security.\n\n" +
        "Shieldersoft Technologies Private Limited builds a broader ecosystem of platforms designed to strengthen an " +
        "organization’s security posture end-to-end. Telemetria, our Third-Party Risk Assessment " +
        "platform, evaluates vendor exposure, external dependencies, and interconnected risks to " +
        "ensure that organizations understand the security posture of every external party they rely " +
        "on. This complements the insights provided in this report by extending risk visibility " +
        "beyond internal code and dependencies to the entire vendor landscape.\n\n" +
        "GuardianDesk streamlines IT operations, asset visibility, privilege workflows, and " +
        "compliance management—ensuring that issues identified during SBOM analysis are " +
        "tied into structured remediation, approval, and audit processes. DedZone serves as a high-" +
        "fidelity honeypot and threat-intelligence system, capturing real attack behavior and " +
        "enabling defensive improvements driven by actual adversary patterns. AntiPen ASM " +
        "expands visibility outward by continuously monitoring the organization’s attack surface, " +
        "identifying exposed services, misconfigurations, and internet-facing risks long before " +
        "attackers can exploit them.\n\n" +
        "Together, these systems form a unified security stack: understanding what the code " +
        "contains, how dependencies behave, what vendors introduce, how attackers probe the " +
        "environment, and how operations respond. The SBOM analysis in this report forms " +
        "the foundation for that stack—giving teams the clarity needed to secure their software and " +
        "maintain trust throughout the lifecycle.",
      M + 20,
      220,
      {
        width: CW - 40,
        align: "left",
      },
    );

  // ══════════════════════════════════════════════ 11. THANK YOU PAGE ════════════
  y = addPage(doc);

  // Remove boxed card approach — use full page composition like reference

  // Decorative top wave lines
  doc.save().strokeColor("#dbeafe").lineWidth(0.8).opacity(0.6);

  for (let i = 0; i < 8; i++) {
    doc
      .moveTo(0, 40 + i * 6)
      .bezierCurveTo(140, 0 + i * 6, 420, 120 + i * 6, PAGE_W, 60 + i * 6)
      .stroke();
  }
  doc.restore();

  doc
    .fillColor(C.brand)
    .font("Helvetica-Oblique")
    .fontSize(30)
    .text("Thank You", 0, 130, {
      width: PAGE_W,
      align: "center",
    });

  // Main Body Text
  doc
    .fillColor(C.grayDark)
    .font("Helvetica")
    .fontSize(9)
    .lineGap(4)
    .text(
      "We sincerely thank you for the opportunity to conduct this web application " +
        "security engagement. Shieldersoft Technologies Private Limited remains committed to helping organizations " +
        "strengthen their security posture by identifying vulnerabilities and providing " +
        "actionable recommendations.\n\n" +
        "The information contained in this report is of a general nature and intended solely " +
        "for your internal use. While every effort has been made to provide accurate and timely " +
        "information, no guarantee can be provided that the information will remain accurate " +
        "or applicable in the future.\n\n" +
        "This report should be treated as a snapshot in time of the tested environment. " +
        "Security is not a one-time activity but an ongoing process requiring regular review, " +
        "monitoring, and improvement.\n\n" +
        "We appreciate your trust in Shieldersoft Technologies and look forward to supporting your continued " +
        "journey toward a more resilient and secure environment.",
      M + 20,
      200,
      {
        width: CW - 40,
        align: "left",
      },
    );

  // Confidential Note
  doc
    .fillColor(C.grayMid)
    .font("Helvetica-Oblique")
    .fontSize(7.5)
    .text(
      "This report is strictly confidential and intended solely for your internal use. " +
        "Unauthorised distribution, reproduction, or disclosure of any part of this document " +
        "is prohibited without prior written consent from Shieldersoft Technologies Private Limited.",
      M + 20,
      PAGE_H - 165,
      {
        width: 250,
        align: "left",
      },
    );

  // Bottom-right Illustration Placeholder
  doc.save();
  doc.circle(PAGE_W - 110, PAGE_H - 95, 45).fill("#dbeafe");

  doc
    .fillColor(C.brand)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("Illustration", PAGE_W - 138, PAGE_H - 98, {
      width: 56,
      align: "center",
    });
  doc.restore();

  // Bottom Decorative Wave
  doc.save().strokeColor("#dbeafe").lineWidth(1).opacity(0.6);

  for (let i = 0; i < 8; i++) {
    doc
      .moveTo(0, PAGE_H - 70 + i * 4)
      .bezierCurveTo(
        120,
        PAGE_H - 110 + i * 4,
        420,
        PAGE_H - 20 + i * 4,
        PAGE_W,
        PAGE_H - 70 + i * 4,
      )
      .stroke();
  }
  doc.restore();

  doc.end();
  return doc;
};

module.exports = { generateScanPDF };
