const fs = require('fs');
const path = require('path');

async function parsePdf(filePath) {
  if (!filePath) {
    throw new Error('File path is required');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.pdf') {
    throw new Error('Only PDF files are supported');
  }

  let dataBuffer;
  try {
    dataBuffer = fs.readFileSync(filePath);
  } catch (err) {
    throw new Error(`Failed to read PDF file: ${err.message}`);
  }

  let pdfjs;
  try {
    pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch (err) {
    throw new Error(`Failed to load PDF parser: ${err.message}`);
  }

  let doc;
  try {
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(dataBuffer), verbosity: 0 });
    doc = await loadingTask.promise;
  } catch (err) {
    throw new Error(`Failed to parse PDF: ${err.message}`);
  }

  const pages = [];

  for (let i = 1; i <= doc.numPages; i++) {
    let page;
    try {
      page = await doc.getPage(i);
    } catch (err) {
      continue;
    }

    let content;
    try {
      content = await page.getTextContent();
    } catch (err) {
      continue;
    }

    const text = content.items
      .map(item => item.str + (item.hasEOL ? '\n' : ''))
      .join(' ')
      .replace(/ +\n/g, '\n')
      .replace(/\n +/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    pages.push({ pageNumber: i, text });
  }

  const allText = pages.map(p => p.text).join('\n\n');

  if (!allText.trim()) {
    throw new Error('PDF contains no extractable text');
  }

  return {
    pages,
    text: allText,
    numPages: doc.numPages,
  };
}

module.exports = { parsePdf };
