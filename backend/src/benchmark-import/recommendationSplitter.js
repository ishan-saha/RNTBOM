function buildPageLookup(pages) {
  const pageLines = [];
  for (const page of pages) {
    const lines = page.text.split('\n');
    for (const line of lines) {
      pageLines.push({ text: line, pageNumber: page.pageNumber });
    }
  }
  return pageLines;
}

function findCategoryTitles(pageLines, recommendationBoundaries) {
  const categories = {};
  const boundaryLineIndices = new Set(recommendationBoundaries.map(b => b.lineIndex));

  for (let i = 0; i < pageLines.length; i++) {
    const line = pageLines[i].text.trim();
    const categoryMatch = line.match(/^(\d+\.\d+)\s+(.+)/);

    if (!categoryMatch) continue;

    const categoryId = categoryMatch[1];
    const categoryTitle = categoryMatch[2].trim();

    if (categoryId.split('.').length !== 2) continue;

    const nextBoundary = recommendationBoundaries.find(b => b.lineIndex > i);
    if (nextBoundary) {
      const nextRuleId = nextBoundary.ruleId;
      const nextCategoryId = nextRuleId.split('.').slice(0, 2).join('.');
      if (nextCategoryId === categoryId) {
        categories[categoryId] = categoryTitle;
      }
    }
  }

  return categories;
}

function splitRecommendations(pages) {
  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    throw new Error('Pages array is required');
  }

  const pageLines = buildPageLookup(pages);
  const ruleIdPattern = /^(\d+\.\d+\.\d+)(?:\s|$)/;

  const recommendationBoundaries = [];

  for (let i = 0; i < pageLines.length; i++) {
    const match = pageLines[i].text.match(ruleIdPattern);
    if (match) {
      recommendationBoundaries.push({ lineIndex: i, ruleId: match[1] });
    }
  }

  if (recommendationBoundaries.length === 0) {
    return [];
  }

  const categoryTitles = findCategoryTitles(pageLines, recommendationBoundaries);

  const recommendations = [];

  for (let b = 0; b < recommendationBoundaries.length; b++) {
    const start = recommendationBoundaries[b].lineIndex;
    const ruleId = recommendationBoundaries[b].ruleId;
    const end = b + 1 < recommendationBoundaries.length
      ? recommendationBoundaries[b + 1].lineIndex
      : pageLines.length;

    const chunkLines = pageLines.slice(start, end);
    const firstLinePage = chunkLines.length > 0 ? chunkLines[0].pageNumber : null;
    const chunkText = chunkLines.map(l => l.text).join('\n').trim();

    const parts = ruleId.split('.');
    const categoryId = parts.slice(0, 2).join('.');

    if (chunkText) {
      recommendations.push({
        ruleId,
        categoryId,
        categoryTitle: categoryTitles[categoryId] || '',
        pageNumber: firstLinePage,
        text: chunkText,
      });
    }
  }

  // Deduplicate by ruleId — keep the entry with the most content
  // (actual rule content is much longer than TOC entries)
  const bestByRuleId = new Map();
  for (const rec of recommendations) {
    const existing = bestByRuleId.get(rec.ruleId);
    if (!existing || rec.text.length > existing.text.length) {
      bestByRuleId.set(rec.ruleId, rec);
    }
  }

  return Array.from(bestByRuleId.values());
}

module.exports = { splitRecommendations };
