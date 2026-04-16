'use strict';

const PDFDocument = require('pdfkit');

// ── Page geometry ─────────────────────────────────────────────────────────────
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M      = 50;          // left / right margin
const CW     = PAGE_W - M * 2; // usable content width

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
    brand:      '#2b2bb2',
    sky:        '#0ea5e9',
    white:      '#ffffff',
    grayDark:   '#374151',
    grayMid:    '#6b7280',
    grayLight:  '#f9fafb',
    grayAlt:    '#f3f4f6',
    grayBorder: '#e5e7eb',
    red:        '#dc2626',
    orange:     '#ea580c',
    yellow:     '#b45309',
    blue:       '#1d4ed8',
    green:      '#15803d',
    redBg:      '#fef2f2',
    orangeBg:   '#fff7ed',
    yellowBg:   '#fffbeb',
    blueBg:     '#eff6ff',
};

// ── Utilities ─────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const sevColor = (s) =>
    ({ critical: C.red, high: C.orange, medium: C.yellow, low: C.blue }[(s || '').toLowerCase()] || C.grayMid);

const fillRect = (doc, x, y, w, h, color) => {
    doc.save().fillColor(color).rect(x, y, w, h).fill().restore();
};

const strokeRect = (doc, x, y, w, h, color = C.grayBorder, lw = 0.5) => {
    doc.save().strokeColor(color).lineWidth(lw).rect(x, y, w, h).stroke().restore();
};

// ── Page chrome (accent bar top + footer bar bottom) ─────────────────────────
let _pageNum = 0;

const drawPageChrome = (doc) => {
    _pageNum++;
    // Top accent bar
    fillRect(doc, 0, 0, PAGE_W, 6, C.brand);
    // Bottom bar
    fillRect(doc, 0, PAGE_H - 24, PAGE_W, 24, C.brand);
    doc.fillColor(C.white).font('Helvetica').fontSize(7)
       .text('SBOM Analysis Report  |  RNT Infosec LLP  |  Confidential',
             M, PAGE_H - 16, { width: CW - 30, align: 'left' });
    doc.fillColor(C.white).font('Helvetica').fontSize(7)
       .text(String(_pageNum), M, PAGE_H - 16, { width: CW, align: 'right' });
};

// Add a new page and return the starting Y below the top bar
const addPage = (doc) => {
    doc.addPage();
    drawPageChrome(doc);
    return M + 15;
};

// ── Section title with blue underline ─────────────────────────────────────────
const sectionTitle = (doc, text, y) => {
    doc.fillColor(C.brand).font('Helvetica-Bold').fontSize(16)
       .text(text, M, y, { width: CW });
    const lineY = y + 22;
    fillRect(doc, M, lineY, CW, 2, C.brand);
    return lineY + 12;
};

// ── Two-column key-value table ────────────────────────────────────────────────
const kvTable = (doc, rows, y, col1W = 165) => {
    const col2W = CW - col1W;
    const ROW_H = 20;
    rows.forEach(([label, value], i) => {
        const bg = i % 2 === 0 ? C.white : C.grayAlt;
        fillRect(doc, M, y, CW, ROW_H, bg);
        strokeRect(doc, M, y, CW, ROW_H);
        doc.fillColor(C.brand).font('Helvetica-Bold').fontSize(8.5)
           .text(String(label), M + 5, y + 6, { width: col1W - 8, lineBreak: false });
        doc.fillColor(C.grayDark).font('Helvetica').fontSize(8.5)
           .text(String(value ?? '—'), M + col1W + 5, y + 6, { width: col2W - 10, lineBreak: false });
        y += ROW_H;
    });
    return y + 6;
};

// ── Multi-column data table with automatic page breaks + header repeat ────────
// cols: [{ label, width, bold?, color(string|fn)? }]
const dataTable = (doc, cols, rows, startY) => {
    const HEADER_H = 22;
    const ROW_H    = 18;

    // Scale columns proportionally if they overflow content width
    const totalW   = cols.reduce((s, c) => s + c.width, 0);
    const scale    = Math.min(1, CW / totalW);
    const scaled   = cols.map((c) => ({ ...c, width: c.width * scale }));
    const tableW   = scaled.reduce((s, c) => s + c.width, 0);

    const drawHeader = (ty) => {
        fillRect(doc, M, ty, tableW, HEADER_H, C.brand);
        let cx = M;
        scaled.forEach((c) => {
            doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5)
               .text(c.label, cx + 4, ty + 7, { width: c.width - 8, lineBreak: false, ellipsis: true });
            cx += c.width;
        });
        return ty + HEADER_H;
    };

    let y = drawHeader(startY);

    rows.forEach((row, ri) => {
        // Page break if this row won't fit
        if (y + ROW_H > PAGE_H - 35) {
            doc.addPage();
            drawPageChrome(doc);
            y = M + 20;
            y = drawHeader(y);
        }

        const bg = ri % 2 === 0 ? C.white : C.grayAlt;
        fillRect(doc, M, y, tableW, ROW_H, bg);
        strokeRect(doc, M, y, tableW, ROW_H);

        let cx = M;
        scaled.forEach((col, ci) => {
            const val = row[ci];
            let color = C.grayDark;
            if (typeof col.color === 'function') color = col.color(val, row);
            else if (col.color)                  color = col.color;

            doc.fillColor(color)
               .font(col.bold ? 'Helvetica-Bold' : 'Helvetica')
               .fontSize(7.5)
               .text(String(val ?? '—'), cx + 4, y + 5,
                     { width: col.width - 8, lineBreak: false, ellipsis: true });
            cx += col.width;
        });

        y += ROW_H;
    });

    return y + 8;
};

// ── Main PDF generator ────────────────────────────────────────────────────────
const generateScanPDF = (scan, report) => {
    _pageNum = 0;

    const doc = new PDFDocument({
        size:   'A4',
        margin: 0,
        info: {
            Title:   `SBOM Report — ${scan.filename || 'Unknown'}`,
            Author:  'RNT Infosec LLP',
            Subject: 'SBOM & CBOM Analysis Report',
            Creator: 'SBOM Platform v1.0',
        },
    });

    const components      = (report && report.components)      || [];
    const vulnerabilities = (report && report.vulnerabilities) || [];
    const summary         = (report && report.summary)         || {};

    const orgName =
        scan.organization && typeof scan.organization === 'object'
            ? scan.organization.name || '—'
            : scan.organization || '—';

    // ═══════════════════════════════════════════════════════════ 1. COVER ════
    _pageNum++;

    // Left accent bar
    fillRect(doc, 0, 0, 8, PAGE_H, C.brand);

    // Bottom footer
    fillRect(doc, 0, PAGE_H - 50, PAGE_W, 50, C.brand);
    doc.fillColor(C.white).font('Helvetica').fontSize(8)
       .text('+91 9211770600  |  www.rntinfosec.in  |  project@rntinfosec.in',
             50, PAGE_H - 32, { width: PAGE_W - 60, align: 'center' });

    // Brand
    doc.fillColor(C.brand).font('Helvetica-Bold').fontSize(24)
       .text('RNT Infosec LLP', 55, 55, { width: CW });
    doc.fillColor(C.grayMid).font('Helvetica').fontSize(10)
       .text('Cybersecurity & Compliance', 55, 86, { width: CW });

    // Rule
    fillRect(doc, 55, 116, CW, 2, C.brand);

    // Main title
    doc.fillColor(C.brand).font('Helvetica-Bold').fontSize(42)
       .text('SOFTWARE BILL', 55, 162, { width: CW });
    doc.fillColor(C.brand).font('Helvetica-Bold').fontSize(42)
       .text('OF MATERIALS', 55, 210, { width: CW });
    fillRect(doc, 55, 260, 200, 5, C.sky);
    doc.fillColor(C.sky).font('Helvetica-Bold').fontSize(30)
       .text('REPORT', 55, 272, { width: CW });

    fillRect(doc, 55, 325, CW, 1, C.grayBorder);

    // Cover metadata
    const coverMeta = [
        ['Prepared For',   orgName],
        ['Date',           fmtDate(scan.completedAt || new Date())],
        ['Report Type',    'SBOM + CBOM Analysis'],
        ['Classification', 'Confidential'],
        ['Scan File',      scan.filename || '—'],
        ['Scan ID',        scan._id ? scan._id.toString() : '—'],
    ];
    let my = 345;
    coverMeta.forEach(([k, v]) => {
        doc.fillColor(C.brand).font('Helvetica-Bold').fontSize(9)
           .text(`${k}:`, 55, my, { continued: true, lineBreak: false });
        doc.fillColor(C.grayDark).font('Helvetica').fontSize(9).text(`  ${v}`);
        my += 22;
    });

    // Decorative curve (low opacity)
    doc.save()
       .strokeColor(C.brand).opacity(0.06).lineWidth(90)
       .moveTo(PAGE_W, 0).quadraticCurveTo(PAGE_W - 160, PAGE_H / 2, PAGE_W, PAGE_H)
       .stroke()
       .restore();

    // ════════════════════════════════════════ 2. DOCUMENT CONTROL ════
    let y = addPage(doc);
    y = sectionTitle(doc, 'Document Control', y);
    y = kvTable(doc, [
        ['Document Title',   'SBOM & CBOM Analysis Report — v1.0'],
        ['Document Version', 'v1.0'],
        ['Report Type',      'SBOM + CBOM'],
        ['Classification',   'Confidential'],
        ['Prepared By',      'RNT Infosec LLP — Automated BOM Analysis Engine'],
        ['Prepared For',     orgName],
        ['Scan File',        scan.filename || '—'],
        ['Scan ID',          scan._id ? scan._id.toString() : '—'],
        ['Scan Type',        (scan.scanType || '—').toUpperCase()],
        ['Format',           (scan.format   || 'CycloneDX').toUpperCase()],
        ['Scan Started',     fmtDate(scan.startedAt)],
        ['Scan Completed',   fmtDate(scan.completedAt)],
        ['Status',           (scan.status || '—').toUpperCase()],
    ], y);

    // ═══════════════════════════════════════ 3. EXECUTIVE SUMMARY ════
    y = addPage(doc);
    y = sectionTitle(doc, 'Executive Summary', y);

    doc.fillColor(C.grayDark).font('Helvetica').fontSize(9).lineGap(3)
       .text(
           'This assessment provides a point-in-time view of the project\'s dependency risks and internal code exposures. ' +
           'The scan identifies vulnerable components, outdated packages, and configuration issues requiring remediation.',
           M, y, { width: CW }
       );
    y = doc.y + 18;

    // Severity cards
    const sevCards = [
        { label: 'CRITICAL', count: scan.vulnCritical ?? summary.critical ?? 0, color: C.red,    bg: C.redBg    },
        { label: 'HIGH',     count: scan.vulnHigh     ?? summary.high     ?? 0, color: C.orange,  bg: C.orangeBg },
        { label: 'MEDIUM',   count: scan.vulnMedium   ?? summary.medium   ?? 0, color: C.yellow,  bg: C.yellowBg },
        { label: 'LOW',      count: scan.vulnLow      ?? summary.low      ?? 0, color: C.blue,    bg: C.blueBg   },
    ];
    const cardW = (CW - 18) / 4;
    const cardH = 64;

    sevCards.forEach((card, i) => {
        const cx = M + i * (cardW + 6);
        fillRect(doc, cx, y, cardW, cardH, card.bg);
        strokeRect(doc, cx, y, cardW, cardH, card.color, 1);
        fillRect(doc, cx, y, 4, cardH, card.color);    // left accent
        doc.fillColor(card.color).font('Helvetica-Bold').fontSize(7)
           .text(card.label, cx + 10, y + 10, { width: cardW - 14, lineBreak: false });
        doc.fillColor(card.color).font('Helvetica-Bold').fontSize(26)
           .text(String(card.count), cx + 10, y + 26, { width: cardW - 14, lineBreak: false });
    });
    y += cardH + 18;

    // Component & vuln summary table
    doc.fillColor(C.brand).font('Helvetica-Bold').fontSize(9)
       .text('COMPONENT & VULNERABILITY SUMMARY', M, y);
    y += 14;

    y = kvTable(doc, [
        ['Total Components Scanned',   String(components.length      || summary.totalComponents      || 0)],
        ['Total Vulnerabilities Found', String(vulnerabilities.length || summary.totalVulnerabilities || 0)],
        ['Critical Vulnerabilities',   String(scan.vulnCritical ?? summary.critical ?? 0)],
        ['High Vulnerabilities',       String(scan.vulnHigh     ?? summary.high     ?? 0)],
        ['Medium Vulnerabilities',     String(scan.vulnMedium   ?? summary.medium   ?? 0)],
        ['Low Vulnerabilities',        String(scan.vulnLow      ?? summary.low      ?? 0)],
    ], y);

    // ══════════════════════════════════════ 4. VULNERABILITY DETAILS ════
    y = addPage(doc);
    y = sectionTitle(doc, 'Vulnerability Details', y);

    doc.fillColor(C.grayDark).font('Helvetica').fontSize(9).lineGap(3)
       .text(
           `The following table lists all ${vulnerabilities.length} ` +
           `vulnerabilit${vulnerabilities.length !== 1 ? 'ies' : 'y'} identified during this scan, ` +
           'including CVE identifiers, affected packages, severity ratings, and recommended fix versions.',
           M, y, { width: CW }
       );
    y = doc.y + 12;

    if (vulnerabilities.length === 0) {
        fillRect(doc, M, y, CW, 38, '#f0fdf4');
        strokeRect(doc, M, y, CW, 38, C.green, 1);
        doc.fillColor(C.green).font('Helvetica-Bold').fontSize(10)
           .text('No vulnerabilities detected in this scan.', M + 15, y + 14, { width: CW - 25 });
        y += 50;
    } else {
        y = dataTable(doc, [
            { label: '#',           width: 24,  color: C.grayMid },
            { label: 'CVE / ID',    width: 110, bold: true, color: C.brand },
            { label: 'Severity',    width: 65,  bold: true, color: (v) => sevColor(v) },
            { label: 'Package',     width: 100, bold: true },
            { label: 'Version',     width: 65,  color: C.grayMid },
            { label: 'Fixed In',    width: 65,  color: C.green },
            { label: 'Description', width: 122 },
        ], vulnerabilities.map((v, i) => [
            i + 1,
            v.cve || '—',
            (v.severity || 'unknown').toUpperCase(),
            v.package || '—',
            v.version || '—',
            v.fixedVersion || '—',
            v.description
                ? (v.description.length > 72 ? v.description.slice(0, 72) + '…' : v.description)
                : '—',
        ]), y);
    }

    // ════════════════════════════════════════════════════ 5. COMPONENTS ════
    if (y + 80 > PAGE_H - 35) {
        y = addPage(doc);
    }
    y = sectionTitle(doc, 'Technical Summary — Components', y);

    doc.fillColor(C.grayDark).font('Helvetica').fontSize(9).lineGap(3)
       .text(
           `All ${components.length} component${components.length !== 1 ? 's' : ''} detected during the scan are listed below.`,
           M, y, { width: CW }
       );
    y = doc.y + 12;

    if (components.length === 0) {
        doc.fillColor(C.grayMid).font('Helvetica').fontSize(9)
           .text('No components were detected in this scan.', M, y, { width: CW });
        y += 20;
    } else {
        y = dataTable(doc, [
            { label: '#',       width: 24,  color: C.grayMid },
            { label: 'Name',    width: 148, bold: true },
            { label: 'Version', width: 80,  color: C.grayMid },
            { label: 'Type',    width: 80 },
            { label: 'Group',   width: 100 },
            { label: 'Scope',   width: 65,  color: C.grayMid },
        ], components.map((c, i) => [
            i + 1,
            c.name    || '—',
            c.version || '—',
            c.type    || '—',
            c.group   || '—',
            c.scope   || '—',
        ]), y);
    }

    // ═══════════════════════════════════════════════════════ 6. EPILOGUE ════
    y = addPage(doc);
    y = sectionTitle(doc, 'The Epilogue', y);

    doc.fillColor(C.grayDark).font('Helvetica').fontSize(9).lineGap(4)
       .text(
           'This report provides a precise, point-in-time view of the project\'s internal and external risks. ' +
           'By mapping every dependency, identifying known vulnerabilities, and exposing configuration weaknesses, ' +
           'this assessment helps teams reduce uncertainty and address issues before they translate into operational impact.',
           M, y, { width: CW }
       );
    y = doc.y + 14;

    doc.fillColor(C.grayDark).font('Helvetica').fontSize(9).lineGap(4)
       .text(
           'Security is not a destination but a continuous process. We recommend scheduling recurring SBOM scans at ' +
           'every release cycle, integrating BOM generation into CI/CD pipelines, and establishing a formal ' +
           'vulnerability management workflow to remediate findings based on severity and exploitability.',
           M, y, { width: CW }
       );
    y = doc.y + 28;

    // Thank you box
    const boxH = 92;
    if (y + boxH > PAGE_H - 35) {
        y = addPage(doc);
    }
    fillRect(doc, M, y, CW, boxH, '#eef2ff');
    strokeRect(doc, M, y, CW, boxH, C.brand, 1);
    fillRect(doc, M, y, 5, boxH, C.brand);
    doc.fillColor(C.brand).font('Helvetica-Bold').fontSize(16)
       .text('Thank You', M, y + 16, { width: CW, align: 'center' });
    doc.fillColor(C.grayDark).font('Helvetica').fontSize(8.5).lineGap(3)
       .text(
           'We sincerely thank you for the opportunity to conduct this SBOM & CBOM analysis engagement.\n' +
           'RNT Infosec LLP remains committed to helping organizations strengthen their security posture.',
           M + 15, y + 44, { width: CW - 25, align: 'center' }
       );

    doc.end();
    return doc;
};

module.exports = { generateScanPDF };
