const SECTION_HEADERS = [
  { key: 'profile', patterns: [/^Profile\s+Applicability/i] },
  { key: 'description', patterns: [/^Description/i] },
  { key: 'rationale', patterns: [/^Rationale/i] },
  { key: 'impact', patterns: [/^Impact/i] },
  { key: 'audit', patterns: [/^Audit/i] },
  { key: 'remediation', patterns: [/^Remediation/i] },
  { key: 'defaultValue', patterns: [/^Default\s+Value/i] },
  { key: 'references', patterns: [/^References/i] },
  { key: 'cisControls', patterns: [/^CIS\s+Controls/i] },
];

function findSectionBoundaries(lines) {
  const boundaries = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    for (const section of SECTION_HEADERS) {
      for (const pattern of section.patterns) {
        if (pattern.test(trimmed)) {
          boundaries.push({ lineIndex: i, key: section.key });
          break;
        }
      }
    }
  }

  boundaries.sort((a, b) => a.lineIndex - b.lineIndex);
  return boundaries;
}

function isSectionHeader(line) {
  const trimmed = line.trim();
  for (const section of SECTION_HEADERS) {
    for (const pattern of section.patterns) {
      if (pattern.test(trimmed)) return true;
    }
  }
  return false;
}

function extractTitleAndStatus(titleLines, ruleId) {
  const combined = (Array.isArray(titleLines) ? titleLines.join(' ') : titleLines)
    .replace(ruleId, '').trim();

  let remainder = combined;

  // Strip trailing leader dots and page number (CIS TOC format: "....219")
  remainder = remainder.replace(/[.\s]*\d+\s*$/, '').trim();

  let statusAssessment = '';
  const statusMatch = remainder.match(/\((Automated|Manual|Disabled|Not Applicable)\)\s*$/i);
  if (statusMatch) {
    statusAssessment = statusMatch[1];
    remainder = remainder.slice(0, statusMatch.index).trim();
  }

  let severity = '';
  const severityMatch = remainder.match(/\(L(\d+)\)/i);
  if (severityMatch) {
    severity = `L${severityMatch[1]}`;
    remainder = remainder.replace(/\(L\d+\)/i, '').trim();
  }

  let title = remainder.replace(/^Ensure\s+/i, '').trim();
  if (!title) {
    title = remainder;
  }

  return { title, severity, statusAssessment };
}

function extractSections(recommendation) {
  if (!recommendation || !recommendation.text) {
    throw new Error('Invalid recommendation object');
  }

  const { ruleId, text, pageNumber, categoryId, categoryTitle } = recommendation;
  const lines = text.split('\n');
  const sectionBoundaries = findSectionBoundaries(lines);

  const firstSectionIndex = sectionBoundaries.length > 0 ? sectionBoundaries[0].lineIndex : lines.length;
  const titleBlock = lines.slice(0, firstSectionIndex);

  let { title, severity, statusAssessment } = extractTitleAndStatus(titleBlock, ruleId);

  const sections = {};
  let currentKey = null;
  let currentLines = [];

  for (let i = firstSectionIndex; i < lines.length; i++) {
    const boundary = sectionBoundaries.find(b => b.lineIndex === i);

    if (boundary) {
      if (currentKey) {
        sections[currentKey] = currentLines.join('\n').trim();
      }
      currentKey = boundary.key;
      currentLines = [];
    } else if (currentKey) {
      if (!isSectionHeader(lines[i])) {
        currentLines.push(lines[i]);
      }
    }
  }

  if (currentKey) {
    sections[currentKey] = currentLines.join('\n').trim();
  }

  const profileText = sections.profile || '';

  let profileLevel = severity || '';
  let profileDescription = '';

  const levelMatch = profileText.match(/Level\s+(\d+)\s*\(?(L\d+)?\)?/i);
  if (levelMatch) {
    if (!profileLevel) {
      profileLevel = `L${levelMatch[1]}`;
      severity = profileLevel;
    }
    const descMatch = profileText.match(/\((.+?)\)/);
    if (descMatch) {
      profileDescription = descMatch[1].replace(/^L\d+\s*/, '').trim();
    }
  }

  let assessment = statusAssessment;
  let supported = true;

  if (!assessment && profileText) {
    const autoMatch = profileText.match(/^\s*(Automated|Manual)/i);
    if (autoMatch) {
      assessment = autoMatch[1];
    }
  }

  if (!assessment) {
    assessment = 'Manual';
  }

  return {
    ruleId,
    categoryId: categoryId || ruleId.split('.').slice(0, 2).join('.'),
    categoryTitle: categoryTitle || '',
    title,
    severity,
    profile: {
      level: profileLevel,
      description: profileDescription,
    },
    status: {
      assessment,
      supported,
    },
    pageNumber: pageNumber || null,
    description: sections.description || '',
    rationale: sections.rationale || '',
    impact: sections.impact || '',
    audit: sections.audit || '',
    remediation: sections.remediation || '',
    defaultValue: sections.defaultValue || '',
    references: sections.references || '',
    cisControls: sections.cisControls || '',
  };
}

module.exports = { extractSections };
