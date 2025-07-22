#!/usr/bin/env node

/**
 * Comprehensive test runner for Vexel frontend
 * Runs integration tests, unit tests, and generates coverage reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test configuration
const testConfig = {
  unit: {
    pattern: '__tests__/unit/**/*.test.{ts,tsx}',
    coverage: true,
    threshold: 80,
  },
  integration: {
    pattern: '__tests__/integration/**/*.test.{ts,tsx}',
    coverage: true,
    threshold: 70,
  },
  e2e: {
    pattern: '__tests__/e2e/**/*.test.{ts,tsx}',
    coverage: false,
    threshold: 0,
  },
};

// Utility functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');

const execCommand = (command, options = {}) => {
  try {
    const result = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      ...options,
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || error.stderr || error.message 
    };
  }
};

// Test runners
const runUnitTests = async () => {
  logSection('Running Unit Tests');
  
  const command = `npm test -- --testPathPattern="${testConfig.unit.pattern}" --coverage --coverageReporters=text-summary --coverageReporters=lcov`;
  const result = execCommand(command);
  
  if (result.success) {
    logSuccess('Unit tests passed');
    
    // Check coverage threshold
    const coverageMatch = result.output.match(/All files[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*(\d+\.?\d*)/);
    if (coverageMatch) {
      const coverage = parseFloat(coverageMatch[1]);
      if (coverage >= testConfig.unit.threshold) {
        logSuccess(`Coverage: ${coverage}% (threshold: ${testConfig.unit.threshold}%)`);
      } else {
        logWarning(`Coverage: ${coverage}% (below threshold: ${testConfig.unit.threshold}%)`);
      }
    }
  } else {
    logError('Unit tests failed');
    console.log(result.output);
  }
  
  return result.success;
};

const runIntegrationTests = async () => {
  logSection('Running Integration Tests');
  
  const command = `npm test -- --testPathPattern="${testConfig.integration.pattern}" --coverage --coverageReporters=text-summary`;
  const result = execCommand(command);
  
  if (result.success) {
    logSuccess('Integration tests passed');
  } else {
    logError('Integration tests failed');
    console.log(result.output);
  }
  
  return result.success;
};

const runE2ETests = async () => {
  logSection('Running E2E Tests');
  
  // Check if E2E tests exist
  const e2eDir = path.join(__dirname, '../__tests__/e2e');
  if (!fs.existsSync(e2eDir)) {
    logInfo('No E2E tests found, skipping...');
    return true;
  }
  
  const command = `npm test -- --testPathPattern="${testConfig.e2e.pattern}"`;
  const result = execCommand(command);
  
  if (result.success) {
    logSuccess('E2E tests passed');
  } else {
    logError('E2E tests failed');
    console.log(result.output);
  }
  
  return result.success;
};

const runLinting = async () => {
  logSection('Running Linting');
  
  const eslintResult = execCommand('npm run lint');
  const prettierResult = execCommand('npm run format:check');
  
  let success = true;
  
  if (eslintResult.success) {
    logSuccess('ESLint passed');
  } else {
    logError('ESLint failed');
    console.log(eslintResult.output);
    success = false;
  }
  
  if (prettierResult.success) {
    logSuccess('Prettier check passed');
  } else {
    logError('Prettier check failed');
    console.log(prettierResult.output);
    success = false;
  }
  
  return success;
};

const runTypeChecking = async () => {
  logSection('Running TypeScript Type Checking');
  
  const result = execCommand('npm run type-check');
  
  if (result.success) {
    logSuccess('TypeScript type checking passed');
  } else {
    logError('TypeScript type checking failed');
    console.log(result.output);
  }
  
  return result.success;
};

const generateCoverageReport = async () => {
  logSection('Generating Coverage Report');
  
  const result = execCommand('npm test -- --coverage --watchAll=false');
  
  if (result.success) {
    logSuccess('Coverage report generated');
    logInfo('Coverage report available at: coverage/lcov-report/index.html');
  } else {
    logError('Failed to generate coverage report');
  }
  
  return result.success;
};

const runPerformanceTests = async () => {
  logSection('Running Performance Tests');
  
  // Check if performance tests exist
  const perfDir = path.join(__dirname, '../__tests__/performance');
  if (!fs.existsSync(perfDir)) {
    logInfo('No performance tests found, skipping...');
    return true;
  }
  
  const command = `npm test -- --testPathPattern="__tests__/performance/**/*.test.{ts,tsx}"`;
  const result = execCommand(command);
  
  if (result.success) {
    logSuccess('Performance tests passed');
  } else {
    logError('Performance tests failed');
    console.log(result.output);
  }
  
  return result.success;
};

const runAccessibilityTests = async () => {
  logSection('Running Accessibility Tests');
  
  // Check if accessibility tests exist
  const a11yDir = path.join(__dirname, '../__tests__/accessibility');
  if (!fs.existsSync(a11yDir)) {
    logInfo('No accessibility tests found, skipping...');
    return true;
  }
  
  const command = `npm test -- --testPathPattern="__tests__/accessibility/**/*.test.{ts,tsx}"`;
  const result = execCommand(command);
  
  if (result.success) {
    logSuccess('Accessibility tests passed');
  } else {
    logError('Accessibility tests failed');
    console.log(result.output);
  }
  
  return result.success;
};

// Main test runner
const runAllTests = async () => {
  log('\n🚀 Starting Vexel Frontend Test Suite', 'bright');
  log('Time: ' + new Date().toLocaleString(), 'blue');
  
  const startTime = Date.now();
  const results = [];
  
  // Run all test suites
  const testSuites = [
    { name: 'Linting', runner: runLinting },
    { name: 'Type Checking', runner: runTypeChecking },
    { name: 'Unit Tests', runner: runUnitTests },
    { name: 'Integration Tests', runner: runIntegrationTests },
    { name: 'Performance Tests', runner: runPerformanceTests },
    { name: 'Accessibility Tests', runner: runAccessibilityTests },
    { name: 'E2E Tests', runner: runE2ETests },
  ];
  
  for (const suite of testSuites) {
    const success = await suite.runner();
    results.push({ name: suite.name, success });
  }
  
  // Generate final coverage report
  await generateCoverageReport();
  
  // Summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  logSection('Test Summary');
  
  results.forEach(({ name, success }) => {
    if (success) {
      logSuccess(`${name}: PASSED`);
    } else {
      logError(`${name}: FAILED`);
    }
  });
  
  const passedCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  log(`\nTotal: ${passedCount}/${totalCount} test suites passed`, 'bright');
  log(`Duration: ${duration}s`, 'blue');
  
  if (passedCount === totalCount) {
    log('\n🎉 All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n💥 Some tests failed!', 'red');
    process.exit(1);
  }
};

// CLI argument parsing
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'unit':
    runUnitTests().then(success => process.exit(success ? 0 : 1));
    break;
  case 'integration':
    runIntegrationTests().then(success => process.exit(success ? 0 : 1));
    break;
  case 'e2e':
    runE2ETests().then(success => process.exit(success ? 0 : 1));
    break;
  case 'lint':
    runLinting().then(success => process.exit(success ? 0 : 1));
    break;
  case 'type-check':
    runTypeChecking().then(success => process.exit(success ? 0 : 1));
    break;
  case 'coverage':
    generateCoverageReport().then(success => process.exit(success ? 0 : 1));
    break;
  case 'performance':
    runPerformanceTests().then(success => process.exit(success ? 0 : 1));
    break;
  case 'accessibility':
    runAccessibilityTests().then(success => process.exit(success ? 0 : 1));
    break;
  case 'all':
  default:
    runAllTests();
    break;
}
