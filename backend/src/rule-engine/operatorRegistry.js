const fs = require('fs');
const path = require('path');

const operators = new Map();
const operatorsDir = path.join(__dirname, 'operators');

function loadOperators() {
  const files = fs.readdirSync(operatorsDir)
    .filter(f => f.endsWith('.js') && f !== 'index.js');

  for (const file of files) {
    const name = path.basename(file, '.js');
    const operator = require(path.join(operatorsDir, file));
    operators.set(name, operator);
  }

  return operators;
}

function getOperator(name) {
  if (operators.size === 0) {
    loadOperators();
  }
  return operators.get(name) || null;
}

function hasOperator(name) {
  if (operators.size === 0) {
    loadOperators();
  }
  return operators.has(name);
}

function listOperators() {
  if (operators.size === 0) {
    loadOperators();
  }
  return Array.from(operators.keys());
}

function compare(operatorName, actual, expected) {
  const operator = getOperator(operatorName);
  if (!operator) {
    return {
      passed: false,
      reason: `Operator "${operatorName}" is not implemented`,
      error: true,
    };
  }

  return operator.compare(actual, expected);
}

module.exports = {
  loadOperators,
  getOperator,
  hasOperator,
  listOperators,
  compare,
};
