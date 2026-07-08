const mongoose = require('mongoose');
const path = require('path');
const Benchmark = require('../models/Benchmark');
const BenchmarkRule = require('../models/BenchmarkRule');
const { importBenchmarkPdf } = require('../benchmark-import/benchmarkImporter');

async function importBenchmark(filePath, originalFileName) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { rules, errors } = await importBenchmarkPdf(filePath);

    if (rules.length === 0) {
      await session.commitTransaction();
      const benchmarkName = path.basename(originalFileName, '.pdf').trim();
      const benchmarkVersion = '1.0.0';
      return {
        benchmarkId: null,
        totalRules: 0,
        importedRules: 0,
        failedRules: 0,
        name: benchmarkName,
        version: benchmarkVersion,
        benchmarkName,
        benchmarkVersion,
      };
    }

    const nameMatch = originalFileName.match(/^(.+?)\s+(?:Benchmark|CIS\s+Benchmark|Benchmark\s+v)?/i);
    const benchmarkName = nameMatch ? nameMatch[1].trim() : path.basename(originalFileName, '.pdf').trim();

    const versionMatch = originalFileName.match(/v?(\d+\.\d+\.\d+)/i);
    const benchmarkVersion = versionMatch ? versionMatch[1] : '1.0.0';

    let category = path.basename(originalFileName, '.pdf')
      .replace(/v?\d+\.\d+\.\d+/i, '')
      .replace(/CIS\s+/i, '')
      .replace(/Benchmark/i, '')
      .trim();

    if (!category) {
      const catMatch = originalFileName.match(/^(Google\s+\S+|CIS\s+\S+|[A-Z][a-z]+)/i);
      category = catMatch ? catMatch[1].trim() : 'General';
    }

    const escapedName = benchmarkName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = await Benchmark.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
      version: benchmarkVersion,
    }).session(session);

    if (existing) {
      throw new Error(`Benchmark "${benchmarkName}" version ${benchmarkVersion} already exists in the database`);
    }

    const [benchmark] = await Benchmark.create([{
      name: benchmarkName,
      version: benchmarkVersion,
      category,
      uploadedDate: new Date(),
      fileName: originalFileName,
    }], { session });

    const ruleDocs = rules.map(rule => ({
      benchmarkId: benchmark._id,
      ruleId: rule.ruleId,
      categoryId: rule.categoryId,
      categoryTitle: rule.categoryTitle,
      title: rule.title,
      severity: rule.severity,
      profile: {
        level: rule.profile.level,
        description: rule.profile.description,
      },
      status: {
        assessment: rule.status.assessment,
        supported: rule.status.supported,
      },
      pageNumber: rule.pageNumber,
      description: rule.description,
      rationale: rule.rationale,
      impact: rule.impact,
      audit: rule.audit,
      remediation: rule.remediation,
      defaultValue: rule.defaultValue,
      references: rule.references,
      cisControls: rule.cisControls,
      rawText: rule.rawText,
      comparison: {
        key: rule.comparison.key,
        operator: rule.comparison.operator,
        expectedValue: rule.comparison.expectedValue,
        configSource: rule.comparison.configSource,
        comparisonType: rule.comparison.comparisonType,
        supportedValues: rule.comparison.supportedValues || [],
        isAutomated: rule.comparison.isAutomated,
      },
    }));

    const insertedRules = await BenchmarkRule.insertMany(ruleDocs, { session });

    await session.commitTransaction();

    return {
      benchmarkId: benchmark._id,
      totalRules: rules.length,
      importedRules: insertedRules.length,
      failedRules: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      name: benchmark.name,
      version: benchmark.version,
      benchmarkName: benchmark.name,
      benchmarkVersion: benchmark.version,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = { importBenchmark };
