const { GEMINI_API_KEY, GEMINI_MODEL } = require('../../config/openRouterConfig');
const logger = require('../../utils/logger');
const { BENCHMARK_EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } = require('./promptService');

const AI_MODEL = process.env.AI_MODEL || GEMINI_MODEL;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function promptLLM(systemPrompt, userPrompt, options = {}) {
  const {
    temperature = 0.1,
    maxTokens = 4096,
    model = AI_MODEL,
  } = options;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info('AI request sent', { model, attempt, maxTokens });

      const url = `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const body = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw Object.assign(new Error(`Gemini API error ${res.status}: ${errText}`), { status: res.status });
      }

      const data = await res.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('Empty response from Gemini');
      }

      logger.info('AI response received', { model, attempt, contentLength: content.length });
      return content;
    } catch (err) {
      lastError = err;
      logger.warn(`AI request failed (attempt ${attempt}/${MAX_RETRIES})`, {
        error: err.message,
        status: err.status,
        model,
      });

      if (err.status === 429) {
        const retryAfter = 5000;
        logger.info(`Rate limited, waiting ${retryAfter}ms`);
        await sleep(retryAfter);
      } else if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(`AI request failed after ${MAX_RETRIES} retries: ${lastError?.message || 'Unknown error'}`);
}

async function promptLLMWithJSON(systemPrompt, userPrompt, options = {}) {
  const raw = await promptLLM(
    `${systemPrompt}\n\nYou must respond with valid JSON only. Do not include markdown code blocks or any text outside the JSON.`,
    userPrompt,
    { ...options, temperature: 0.05 }
  );

  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`Failed to parse AI response as JSON: ${err.message}`);
  }
}

async function extractRulesFromText(text, chunkInfo = '') {
  const userPrompt = buildExtractionUserPrompt(text, chunkInfo);
  return promptLLMWithJSON(BENCHMARK_EXTRACTION_SYSTEM_PROMPT, userPrompt, { maxTokens: 8192 });
}

const RULES_BATCH_SIZE = parseInt(process.env.RULES_BATCH_SIZE || '100', 10);
const BATCH_DELAY_MS = parseInt(process.env.BATCH_DELAY_MS || '15000', 10);

function flattenConfig(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenConfig(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

async function aiEvaluateRules(benchmarkName, benchmarkVersion, rules, config) {
  const flatConfig = flattenConfig(config);
  const results = [];

  for (let i = 0; i < rules.length; i += RULES_BATCH_SIZE) {
    const batch = rules.slice(i, i + RULES_BATCH_SIZE);
    const batchResults = await evaluateBatch(benchmarkName, benchmarkVersion, batch, flatConfig);
    results.push(...batchResults);
    if (i + RULES_BATCH_SIZE < rules.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return results;
}

async function evaluateBatch(benchmarkName, benchmarkVersion, rules, flatConfig) {
  const systemPrompt = 'You are a CIS benchmark compliance expert. For each rule, compare the actual configuration value against the expected secure value. Determine PASS if the actual value satisfies the requirement, FAIL if it violates it, or WARNING if the result is ambiguous or requires manual review. Respond with valid JSON only — an array of objects.';

  const rulesBlock = rules.map(rule => {
    const key = rule.comparison?.key || '';
    const expected = rule.comparison?.expectedValue;
    const actual = key ? (flatConfig[key] !== undefined ? flatConfig[key] : 'NOT_FOUND') : 'NOT_FOUND';
    return {
      ruleId: rule.ruleId,
      title: rule.title || '',
      description: rule.description || '',
      severity: rule.severity || '',
      configKey: key,
      expectedValue: expected,
      actualValue: actual,
      remediation: rule.remediation || '',
    };
  });

  const userPrompt = `Benchmark: ${benchmarkName || 'Unknown'} v${benchmarkVersion || 'N/A'}
Total Rules in this batch: ${rules.length}

For each rule, evaluate whether the actual configuration value complies with the security requirement. Consider:
- Semantic equivalence and case insensitivity
- Whether values like "true"/"1"/"yes" are equivalent
- Range and comparison logic (e.g., "greater than 90" means ≤90 is FAIL)
- If a config key is NOT_FOUND, the requirement is FAIL

Respond with a JSON array of objects. Each object must have:
{
  "ruleId": "string - the rule ID",
  "status": "pass|fail|warning",
  "reason": "string - brief explanation of the evaluation",
  "confidence": number between 0 and 1 indicating confidence level,
  "risk": "critical|high|medium|low - risk level if FAILED",
  "recommendation": "string - actionable recommendation"
}

Rules to evaluate:
${JSON.stringify(rulesBlock, null, 2)}`;

  try {
    const parsed = await promptLLMWithJSON(systemPrompt, userPrompt, { temperature: 0.05, maxTokens: 4096 });
    const arr = Array.isArray(parsed) ? parsed : (parsed.results || parsed.evaluations || []);
    const origKeys = {};
    rules.forEach(r => {
      const key = r.comparison?.key || '';
      origKeys[r.ruleId] = {
        actual: key ? (flatConfig[key] !== undefined ? flatConfig[key] : 'NOT_FOUND') : null,
        expected: r.comparison?.expectedValue ?? null,
      };
    });

    return arr.map(item => {
      const orig = origKeys[item.ruleId] || {};
      return {
        ruleId: item.ruleId || '',
        status: (item.status || 'fail').toLowerCase(),
        reason: item.reason || '',
        confidence: typeof item.confidence === 'number' ? item.confidence : null,
        risk: item.risk || null,
        recommendation: item.recommendation || '',
        actual: orig.actual,
        expected: orig.expected,
      };
    });
  } catch (err) {
    console.error('Batch evaluation failed:', err.message);
    return rules.map(rule => {
      const key = rule.comparison?.key || '';
      return {
        ruleId: rule.ruleId,
        status: 'fail',
        reason: `AI evaluation error: ${err.message}`,
        confidence: null,
        risk: null,
        recommendation: rule.remediation || '',
        actual: key ? (flatConfig[key] !== undefined ? flatConfig[key] : 'NOT_FOUND') : null,
        expected: rule.comparison?.expectedValue ?? null,
      };
    });
  }
}

async function evaluateSemantic(rule, key, actualValue, expectedValue) {
  const systemPrompt = 'You are a cybersecurity compliance expert. Compare an actual configuration value against an expected secure value and determine if the system is compliant. Respond with valid JSON only.';
  const userPrompt = `Rule: ${rule.title || rule.ruleId || 'Unknown'}
Description: ${rule.description || ''}
Configuration Key: ${key}
Expected Value: ${expectedValue !== null && expectedValue !== undefined ? JSON.stringify(expectedValue) : 'Not specified'}
Actual Value: ${actualValue !== null && actualValue !== undefined ? JSON.stringify(actualValue) : 'Not found'}

Determine if the actual value satisfies the security requirement. Consider semantic equivalence, case insensitivity, and reasonable interpretation.

Respond with JSON: { "status": "pass" or "fail", "reason": "explanation" }`;

  try {
    const result = await promptLLMWithJSON(systemPrompt, userPrompt, { temperature: 0.1, maxTokens: 512 });
    return {
      status: result.status === 'pass' ? 'pass' : 'fail',
      reason: result.reason || 'Semantic evaluation completed',
    };
  } catch {
    return { status: 'fail', reason: 'AI semantic evaluation unavailable' };
  }
}

async function generateExecutiveSummary(scanSummary, results, benchmarkName) {
  const systemPrompt = 'You are a cybersecurity compliance reporting expert. Generate a concise executive summary of compliance scan results. Focus on key findings, overall security posture, and critical issues. Write in professional business language.';
  const userPrompt = `Compliance Scan Results for ${benchmarkName || 'Benchmark'}:
- Total Rules: ${scanSummary.total || scanSummary.totalRules || 0}
- Passed: ${scanSummary.passed || 0}
- Failed: ${scanSummary.failed || 0}
- Warnings: ${scanSummary.warning || 0}
- Compliance Score: ${scanSummary.compliancePercentage || 0}%

Failed rules by severity: ${(results || []).filter(r => r.result === 'fail').reduce((acc, r) => { const s = r.severity || 'unspecified'; acc[s] = (acc[s] || 0) + 1; return acc; }, {})}

Write a professional executive summary (3-4 paragraphs) covering: overall security posture, key risks identified, and recommended focus areas.`;

  try {
    return await promptLLM(systemPrompt, userPrompt, { temperature: 0.3, maxTokens: 1024 });
  } catch {
    return 'Compliance scan completed. Review the detailed results below for specific findings and recommendations.';
  }
}

async function generateRiskAnalysis(results) {
  const systemPrompt = 'You are a cybersecurity risk analyst. Analyze compliance scan results and identify risks. Respond with valid JSON only.';
  const failedCount = (results || []).filter(r => r.result === 'fail').length;
  const warningCount = (results || []).filter(r => r.result === 'warning').length;
  const highSev = (results || []).filter(r => r.result === 'fail' && (r.severity || '').toLowerCase() === 'high').length;
  const critSev = (results || []).filter(r => r.result === 'fail' && (r.severity || '').toLowerCase() === 'critical').length;
  const topFailed = (results || []).filter(r => r.result === 'fail').slice(0, 5).map(r => ({ ruleId: r.ruleId, title: r.title, severity: r.severity }));

  const userPrompt = `Failed Rules: ${failedCount}
Critical: ${critSev}
High: ${highSev}
Warnings: ${warningCount}

Top Failed Rules: ${JSON.stringify(topFailed)}

Respond with JSON: { "overallRiskLevel": "critical"/"high"/"medium"/"low", "riskFactors": ["..."], "topRisks": ["..."], "complianceImplications": "..." }`;

  try {
    return await promptLLMWithJSON(systemPrompt, userPrompt, { temperature: 0.2, maxTokens: 1024 });
  } catch {
    return {
      overallRiskLevel: failedCount > 5 ? 'high' : failedCount > 2 ? 'medium' : 'low',
      riskFactors: [`${failedCount} failed configuration checks`],
      topRisks: topFailed.map(r => `${r.title} (${r.severity})`),
      complianceImplications: `${failedCount} rules require remediation to improve compliance score.`,
    };
  }
}

async function generateAIRecommendations(results) {
  const systemPrompt = 'You are a cybersecurity compliance advisor. Generate actionable remediation recommendations based on scan findings. Respond with valid JSON only.';
  const failed = (results || []).filter(r => r.result === 'fail').slice(0, 10).map(r => ({
    ruleId: r.ruleId, title: r.title, severity: r.severity, remediation: r.remediation,
  }));

  const userPrompt = `Failed rules needing remediation: ${JSON.stringify(failed)}

Respond with JSON: { "prioritizedActions": [{"ruleId": "...", "title": "...", "action": "...", "priority": "high/medium/low"}], "quickWins": [{"ruleId": "...", "title": "...", "action": "..."}], "dependencies": [] }`;

  try {
    return await promptLLMWithJSON(systemPrompt, userPrompt, { temperature: 0.2, maxTokens: 1024 });
  } catch {
    return {
      prioritizedActions: failed.map(r => ({
        ruleId: r.ruleId, title: r.title,
        action: r.remediation || 'Review and apply recommended configuration',
        priority: r.severity === 'critical' || r.severity === 'high' ? 'high' : 'medium',
      })),
      quickWins: failed.filter(r => r.severity === 'low' || r.severity === 'medium').map(r => ({
        ruleId: r.ruleId, title: r.title, action: r.remediation || 'Apply recommended fix',
      })),
      dependencies: [],
    };
  }
}

async function isAIAvailable() {
  if (!GEMINI_API_KEY) return false;
  try {
    const url = `${GEMINI_BASE}/${AI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch {
    return false;
  }
}

module.exports = {
  extractRulesFromText,
  isAIAvailable,
  promptLLM,
  promptLLMWithJSON,
  evaluateSemantic,
  aiEvaluateRules,
  generateExecutiveSummary,
  generateRiskAnalysis,
  generateAIRecommendations,
};
