function analyzeCategories(results) {
  const categories = {};

  for (const r of results) {
    const catId = r.categoryId || 'uncategorized';
    const catTitle = r.categoryTitle || 'Uncategorized';

    if (!categories[catId]) {
      categories[catId] = {
        categoryId: catId,
        categoryTitle: catTitle,
        total: 0,
        passed: 0,
        failed: 0,
        warning: 0,
        compliance: 0,
      };
    }

    categories[catId].total++;

    switch (r.result) {
      case 'pass': categories[catId].passed++; break;
      case 'fail': categories[catId].failed++; break;
      case 'warning': categories[catId].warning = (categories[catId].warning || 0) + 1; break;
    }
  }

  for (const cat of Object.values(categories)) {
    const evaluable = cat.passed + cat.failed;
    cat.compliance = evaluable > 0
      ? Number(((cat.passed / evaluable) * 100).toFixed(2))
      : 0;
  }

  return categories;
}

module.exports = { analyzeCategories };