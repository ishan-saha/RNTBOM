const mongoose = require('mongoose');
const path = require('path');
const Benchmark = require('../models/Benchmark');
const BenchmarkRule = require('../models/BenchmarkRule');
const { parsePdf } = require('../benchmark-import/pdfParser');
const { splitRecommendations } = require('../benchmark-import/recommendationSplitter');
const { extractSections } = require('../benchmark-import/sectionExtractor');
const { normalizeRule } = require('../benchmark-import/ruleNormalizer');
const { extractRulesWithAI } = require('./ai/aiRuleExtractor');
const { isAIAvailable } = require('./ai/aiService');
const { validateBenchmarkExtraction } = require('./validationService');
const logger = require('../utils/logger');

function normalizeAIRule(rule) {
  return {
    ruleId: rule.ruleId || '',
    categoryId: rule.categoryId || '',
    categoryTitle: rule.categoryTitle || '',
    title: rule.title || '',
    severity: rule.severity || '',
    profile: {
      level: rule.severity || '',
      description: '',
    },
    status: {
      assessment: rule.isAutomated ? 'Automated' : 'Manual',
      supported: true,
    },
    pageNumber: null,
    description: rule.description || '',
    rationale: rule.rationale || '',
    impact: rule.impact || '',
    audit: rule.audit || '',
    remediation: rule.remediation || '',
    defaultValue: '',
    references: rule.additionalNotes || '',
    cisControls: '',
    rawText: '',
    comparison: {
      key: rule.configKey || null,
      operator: rule.comparisonOperator || null,
      expectedValue: rule.expectedValue !== undefined ? rule.expectedValue : null,
      configSource: rule.configSource || null,
      comparisonType: null,
      supportedValues: [],
      isAutomated: rule.isAutomated === true,
      conditions: [],
      logic: null,
    },
  };
}

function mergeRules(aiRules, deterministicRules) {
  const aiMap = new Map();
  for (const r of aiRules) {
    if (r.ruleId) aiMap.set(r.ruleId, normalizeAIRule(r));
  }

  const merged = [];
  const seenIds = new Set();

  for (const r of aiRules) {
    if (r.ruleId && !seenIds.has(r.ruleId)) {
      merged.push(normalizeAIRule(r));
      seenIds.add(r.ruleId);
    }
  }

  for (const r of deterministicRules) {
    if (r.ruleId && !seenIds.has(r.ruleId)) {
      merged.push(r);
      seenIds.add(r.ruleId);
    }
  }

  return merged;
}

function extractBenchmarkInfo(fileName) {
  const nameMatch = fileName.match(/^(.+?)(?:\s+(?:Benchmark|CIS\s+Benchmark|v\d))?/i);
  const name = nameMatch ? nameMatch[1].trim() : path.basename(fileName, '.pdf').trim();

  const versionMatch = fileName.match(/v?(\d+\.\d+(?:\.\d+)?)/i);
  const version = versionMatch ? versionMatch[1] : '1.0.0';

  let category = path.basename(fileName, '.pdf')
    .replace(/v?\d+(?:\.\d+)*(?:\.\d+)?/i, '')
    .replace(/CIS\s+/i, '')
    .replace(/Benchmark/i, '')
    .trim();

  if (!category) {
    const words = fileName.split(/[\s_-]+/);
    category = words.find(w => w.length > 2) || 'General';
  }

  return { name, version, category };
}

async function runDeterministicExtraction(filePath) {
  const startTime = Date.now();
  const pdfResult = await parsePdf(filePath);
  const recommendations = splitRecommendations(pdfResult.pages);

  const rules = [];
  const errors = [];

  for (const rec of recommendations) {
    try {
      const parsed = extractSections(rec);
      const normalized = normalizeRule(parsed);
      rules.push({
        ruleId: normalized.ruleId,
        categoryId: normalized.categoryId,
        categoryTitle: normalized.categoryTitle,
        title: normalized.title,
        severity: normalized.severity,
        profile: normalized.profile,
        status: normalized.status,
        pageNumber: normalized.pageNumber,
        description: normalized.description,
        rationale: normalized.rationale,
        impact: normalized.impact,
        audit: normalized.audit,
        remediation: normalized.remediation,
        defaultValue: normalized.defaultValue,
        references: normalized.references,
        cisControls: normalized.cisControls,
        rawText: rec.text,
        comparison: normalized.comparison,
      });
    } catch (err) {
      errors.push({ ruleId: rec.ruleId, error: err.message });
    }
  }

  return {
    rules,
    errors,
    numPages: pdfResult.numPages,
    text: pdfResult.text,
    duration: Date.now() - startTime,
  };
}

async function runAIExtraction(pdfText, numPages) {
  const startTime = Date.now();
  const result = await extractRulesWithAI(pdfText, numPages);

  if (result.totalExtracted === 0) {
    return { rules: [], totalExtracted: 0, duration: Date.now() - startTime, validation: null };
  }

  const validation = validateBenchmarkExtraction({
    benchmarkName: '',
    benchmarkVersion: '',
    benchmarkCategory: '',
    rules: result.rules,
  });

  return {
    rules: validation.rules,
    totalExtracted: validation.totalValid,
    duration: Date.now() - startTime,
    validation: {
      totalRaw: validation.totalRaw,
      totalValid: validation.totalValid,
      totalSkipped: validation.totalSkipped,
      errors: validation.errors,
      warnings: validation.warnings,
    },
  };
}

async function importBenchmark(filePath, originalFileName) {
  const overallStart = Date.now();
  logger.info('Benchmark import started', { file: originalFileName });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const detResult = await runDeterministicExtraction(filePath);
    logger.info('PDF extraction completed', {
      numPages: detResult.numPages,
      deterministicRules: detResult.rules.length,
      errors: detResult.errors.length,
      duration: detResult.duration,
    });

    let rules = detResult.rules;
    let aiInfo = null;

    const aiAvailable = await isAIAvailable();
    if (aiAvailable && detResult.text) {
      try {
        const aiResult = await runAIExtraction(detResult.text, detResult.numPages);
        if (aiResult.totalExtracted > 0) {
          rules = mergeRules(aiResult.rules, detResult.rules);
          aiInfo = {
            totalExtracted: aiResult.totalExtracted,
            duration: aiResult.duration,
            validation: aiResult.validation,
          };
          logger.info('AI extraction merged', {
            aiRules: aiResult.totalExtracted,
            totalAfterMerge: rules.length,
          });
        }
      } catch (err) {
        logger.warn('AI extraction failed, using deterministic only', { error: err.message });
      }
    }

    if (rules.length === 0) {
      await session.commitTransaction();
      logger.info('No rules extracted', { file: originalFileName });
      return {
        benchmarkId: null,
        name: path.basename(originalFileName, '.pdf').trim(),
        version: '1.0.0',
        category: 'Unknown',
        totalRules: 0,
        totalAutomated: 0,
        totalManual: 0,
        totalInvalid: detResult.errors.length,
        totalDuplicates: 0,
        deterministicErrors: detResult.errors.length,
        aiExtracted: aiInfo?.totalExtracted || 0,
        processingTime: Date.now() - overallStart,
        aiEnhanced: !!aiInfo,
      };
    }

    const { name, version, category } = extractBenchmarkInfo(originalFileName);

    const existing = await Benchmark.findOne({
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      version,
    }).session(session);

    if (existing) {
      throw new Error(`Benchmark "${name}" version ${version} already exists. Delete it first or upload a different version.`);
    }

    const [benchmark] = await Benchmark.create([{
      name,
      version,
      category: category || 'General',
      uploadedDate: new Date(),
      fileName: originalFileName,
    }], { session });

    const existingRuleIds = new Set();
    const uniqueRules = [];

    for (const rule of rules) {
      if (!existingRuleIds.has(rule.ruleId)) {
        existingRuleIds.add(rule.ruleId);
        uniqueRules.push(rule);
      }
    }

    const ruleDocs = uniqueRules.map(rule => ({
      benchmarkId: benchmark._id,
      ruleId: rule.ruleId,
      categoryId: rule.categoryId || '',
      categoryTitle: rule.categoryTitle || '',
      title: rule.title || '',
      severity: rule.severity || '',
      profile: {
        level: rule.profile?.level || rule.severity || '',
        description: rule.profile?.description || '',
      },
      status: {
        assessment: rule.status?.assessment || (rule.comparison?.isAutomated ? 'Automated' : 'Manual'),
        supported: rule.status?.supported !== undefined ? rule.status.supported : true,
      },
      pageNumber: rule.pageNumber || null,
      description: rule.description || '',
      rationale: rule.rationale || '',
      impact: rule.impact || '',
      audit: rule.audit || '',
      remediation: rule.remediation || '',
      defaultValue: rule.defaultValue || '',
      references: rule.references || '',
      cisControls: rule.cisControls || '',
      rawText: rule.rawText || '',
      comparison: {
        key: rule.comparison?.key || null,
        operator: rule.comparison?.operator || null,
        expectedValue: rule.comparison?.expectedValue !== undefined ? rule.comparison.expectedValue : null,
        configSource: rule.comparison?.configSource || null,
        comparisonType: rule.comparison?.comparisonType || null,
        supportedValues: rule.comparison?.supportedValues || [],
        isAutomated: rule.comparison?.isAutomated === undefined ? true : rule.comparison.isAutomated,
        conditions: rule.comparison?.conditions || [],
        logic: rule.comparison?.logic || null,
      },
    }));

    const insertedRules = await BenchmarkRule.insertMany(ruleDocs, { session });
    const automatedCount = ruleDocs.filter(r => r.comparison.isAutomated).length;
    const manualCount = ruleDocs.filter(r => !r.comparison.isAutomated).length;

    await session.commitTransaction();

    const totalTime = Date.now() - overallStart;
    logger.info('Benchmark import completed', {
      benchmarkId: benchmark._id,
      name,
      version,
      totalRules: ruleDocs.length,
      automated: automatedCount,
      manual: manualCount,
      duration: totalTime,
      aiEnhanced: !!aiInfo,
    });

    return {
      benchmarkId: benchmark._id,
      name,
      version,
      category: benchmark.category,
      fileName: originalFileName,
      totalRules: ruleDocs.length,
      totalAutomated: automatedCount,
      totalManual: manualCount,
      totalInvalid: detResult.errors.length,
      totalDuplicates: rules.length - uniqueRules.length,
      deterministicErrors: detResult.errors.length,
      aiExtracted: aiInfo?.totalExtracted || 0,
      aiValidationErrors: aiInfo?.validation?.totalSkipped || 0,
      aiValidationWarnings: aiInfo?.validation?.warnings || [],
      processingTime: totalTime,
      aiEnhanced: !!aiInfo,
    };
  } catch (error) {
    await session.abortTransaction();
    logger.error('Benchmark import failed', { error: error.message, file: originalFileName });
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = { importBenchmark };
