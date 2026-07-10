const { extractRulesFromText } = require('./aiService');
const logger = require('../../utils/logger');

function findRuleBoundaries(text) {
  const boundaries = [];
  const ruleIdPattern = /^(\d+\.\d+\.\d+)(?:\s|$)/gm;
  let match;
  while ((match = ruleIdPattern.exec(text)) !== null) {
    boundaries.push({ index: match.index, ruleId: match[1] });
  }
  return boundaries;
}

function chunkText(text, maxChars = 15000) {
  const boundaries = findRuleBoundaries(text);

  if (boundaries.length === 0) {
    if (text.length <= maxChars) return [text];
    const chunks = [];
    for (let i = 0; i < text.length; i += maxChars) {
      chunks.push(text.slice(i, i + maxChars));
    }
    return chunks;
  }

  const chunks = [];
  let chunkStart = 0;

  for (let i = 0; i < boundaries.length; i++) {
    const boundary = boundaries[i];
    if (boundary.index - chunkStart >= maxChars && chunks.length > 0) {
      const previousBoundary = boundaries[i - 1];
      const chunkEnd = previousBoundary ? previousBoundary.index + text.slice(previousBoundary.index).search(/\n/) : boundary.index;
      chunks.push(text.slice(chunkStart, chunkEnd));
      chunkStart = chunkEnd;
    }
  }

  if (chunkStart < text.length) {
    chunks.push(text.slice(chunkStart));
  }

  if (chunks.length === 0) {
    chunks.push(text);
  }

  const merged = [];
  for (const chunk of chunks) {
    if (merged.length > 0 && merged[merged.length - 1].length < maxChars * 0.5) {
      merged[merged.length - 1] += '\n' + chunk;
    } else {
      merged.push(chunk);
    }
  }

  return merged;
}

async function extractRulesWithAI(pdfText, numPages) {
  const chunks = chunkText(pdfText);
  logger.info('AI extraction started', { totalChars: pdfText.length, chunks: chunks.length, numPages });

  const allRules = [];
  const chunkErrors = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkInfo = `Page section ${i + 1} of ${chunks.length}`;
    try {
      logger.info(`Processing chunk ${i + 1}/${chunks.length}`, { chunkSize: chunks[i].length });
      const result = await extractRulesFromText(chunks[i], chunkInfo);

      const extractedRules = result?.rules || [];
      if (extractedRules.length > 0) {
        allRules.push(...extractedRules);
        logger.info(`Extracted ${extractedRules.length} rules from chunk ${i + 1}`);
      } else {
        logger.warn(`No rules found in chunk ${i + 1}`);
      }
    } catch (err) {
      chunkErrors.push({ chunk: i + 1, error: err.message });
      logger.error(`AI extraction failed for chunk ${i + 1}`, { error: err.message });
    }
  }

  const seen = new Set();
  const deduplicated = [];
  for (const rule of allRules) {
    if (rule.ruleId && !seen.has(rule.ruleId)) {
      seen.add(rule.ruleId);
      deduplicated.push(rule);
    }
  }

  const result = {
    rules: deduplicated,
    totalExtracted: deduplicated.length,
    chunksProcessed: chunks.length,
    chunkErrors: chunkErrors.length > 0 ? chunkErrors : undefined,
  };

  logger.info('AI extraction completed', {
    totalExtracted: result.totalExtracted,
    chunksProcessed: result.chunksProcessed,
    chunkErrors: chunkErrors.length,
  });

  return result;
}

module.exports = { extractRulesWithAI, chunkText };
