#!/usr/bin/env node

/**
 * Integration Test Script
 * 
 * This script performs comprehensive integration testing of the frontend application
 * including API connectivity, performance checks, and deployment verification.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  timeout: 10000,
  retries: 3
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retry = async (fn, retries = config.retries) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
};

// Test functions
const testApiConnectivity = async () => {
  log('Testing API connectivity...');
  
  try {
    const response = await retry(async () => {
      return await axios.get(`${config.apiBaseUrl}/health`, {
        timeout: config.timeout
      });
    });
    
    if (response.status === 200) {
      log('API connectivity test passed', 'success');
      results.passed++;
      results.tests.push({ name: 'API Connectivity', status: 'passed' });
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    log(`API connectivity test failed: ${error.message}`, 'error');
    results.failed++;
    results.tests.push({ name: 'API Connectivity', status: 'failed', error: error.message });
  }
};

const testAuthEndpoints = async () => {
  log('Testing authentication endpoints...');
  
  const testCases = [
    { endpoint: '/auth/login', method: 'POST' },
    { endpoint: '/auth/register', method: 'POST' }
  ];
  
  for (const testCase of testCases) {
    try {
      const response = await retry(async () => {
        return await axios({
          method: testCase.method,
          url: `${config.apiBaseUrl}${testCase.endpoint}`,
          data: {}, // Empty data to test endpoint availability
          timeout: config.timeout,
          validateStatus: () => true // Accept any status code
        });
      });
      
      // We expect 400 or 422 for empty data, not 404 or 500
      if ([400, 422].includes(response.status)) {
        log(`Auth endpoint ${testCase.endpoint} test passed`, 'success');
        results.passed++;
        results.tests.push({ 
          name: `Auth Endpoint ${testCase.endpoint}`, 
          status: 'passed' 
        });
      } else if (response.status === 404) {
        throw new Error(`Endpoint not found: ${testCase.endpoint}`);
      } else if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      } else {
        log(`Auth endpoint ${testCase.endpoint} test passed (status: ${response.status})`, 'success');
        results.passed++;
        results.tests.push({ 
          name: `Auth Endpoint ${testCase.endpoint}`, 
          status: 'passed' 
        });
      }
    } catch (error) {
      log(`Auth endpoint ${testCase.endpoint} test failed: ${error.message}`, 'error');
      results.failed++;
      results.tests.push({ 
        name: `Auth Endpoint ${testCase.endpoint}`, 
        status: 'failed', 
        error: error.message 
      });
    }
  }
};

const testNotesEndpoints = async () => {
  log('Testing notes endpoints...');
  
  const testCases = [
    { endpoint: '/notes', method: 'GET' },
    { endpoint: '/notes', method: 'POST' }
  ];
  
  for (const testCase of testCases) {
    try {
      const response = await retry(async () => {
        return await axios({
          method: testCase.method,
          url: `${config.apiBaseUrl}${testCase.endpoint}`,
          data: testCase.method === 'POST' ? {} : undefined,
          timeout: config.timeout,
          validateStatus: () => true
        });
      });
      
      // We expect 401 for unauthorized requests, not 404 or 500
      if ([401, 403].includes(response.status)) {
        log(`Notes endpoint ${testCase.method} ${testCase.endpoint} test passed (auth required)`, 'success');
        results.passed++;
        results.tests.push({ 
          name: `Notes Endpoint ${testCase.method} ${testCase.endpoint}`, 
          status: 'passed' 
        });
      } else if (response.status === 404) {
        throw new Error(`Endpoint not found: ${testCase.endpoint}`);
      } else if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      } else {
        log(`Notes endpoint ${testCase.method} ${testCase.endpoint} test passed (status: ${response.status})`, 'success');
        results.passed++;
        results.tests.push({ 
          name: `Notes Endpoint ${testCase.method} ${testCase.endpoint}`, 
          status: 'passed' 
        });
      }
    } catch (error) {
      log(`Notes endpoint ${testCase.method} ${testCase.endpoint} test failed: ${error.message}`, 'error');
      results.failed++;
      results.tests.push({ 
        name: `Notes Endpoint ${testCase.method} ${testCase.endpoint}`, 
        status: 'failed', 
        error: error.message 
      });
    }
  }
};

const testFrontendBuild = async () => {
  log('Testing frontend build...');
  
  const buildPath = path.join(__dirname, '..', 'build');
  const indexPath = path.join(buildPath, 'index.html');
  
  try {
    // Check if build directory exists
    if (!fs.existsSync(buildPath)) {
      throw new Error('Build directory does not exist. Run "npm run build" first.');
    }
    
    // Check if index.html exists
    if (!fs.existsSync(indexPath)) {
      throw new Error('index.html not found in build directory');
    }
    
    // Check if static assets exist
    const staticPath = path.join(buildPath, 'static');
    if (!fs.existsSync(staticPath)) {
      throw new Error('Static assets directory not found');
    }
    
    // Check for JS and CSS files
    const jsPath = path.join(staticPath, 'js');
    const cssPath = path.join(staticPath, 'css');
    
    if (!fs.existsSync(jsPath) || fs.readdirSync(jsPath).length === 0) {
      throw new Error('No JavaScript files found in build');
    }
    
    if (!fs.existsSync(cssPath) || fs.readdirSync(cssPath).length === 0) {
      throw new Error('No CSS files found in build');
    }
    
    log('Frontend build test passed', 'success');
    results.passed++;
    results.tests.push({ name: 'Frontend Build', status: 'passed' });
  } catch (error) {
    log(`Frontend build test failed: ${error.message}`, 'error');
    results.failed++;
    results.tests.push({ name: 'Frontend Build', status: 'failed', error: error.message });
  }
};

const testEnvironmentConfiguration = async () => {
  log('Testing environment configuration...');
  
  try {
    const envExamplePath = path.join(__dirname, '..', '.env.example');
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    
    // Check if .env.example exists
    if (!fs.existsSync(envExamplePath)) {
      throw new Error('.env.example file not found');
    }
    
    // Check if package.json exists and has required scripts
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredScripts = ['start', 'build', 'test'];
    
    for (const script of requiredScripts) {
      if (!packageJson.scripts || !packageJson.scripts[script]) {
        throw new Error(`Required script "${script}" not found in package.json`);
      }
    }
    
    // Check for required dependencies
    const requiredDeps = ['react', 'react-dom', 'react-router-dom', 'axios'];
    
    for (const dep of requiredDeps) {
      if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
        throw new Error(`Required dependency "${dep}" not found`);
      }
    }
    
    log('Environment configuration test passed', 'success');
    results.passed++;
    results.tests.push({ name: 'Environment Configuration', status: 'passed' });
  } catch (error) {
    log(`Environment configuration test failed: ${error.message}`, 'error');
    results.failed++;
    results.tests.push({ name: 'Environment Configuration', status: 'failed', error: error.message });
  }
};

const testPerformanceMetrics = async () => {
  log('Testing performance metrics...');
  
  try {
    const buildPath = path.join(__dirname, '..', 'build');
    const staticPath = path.join(buildPath, 'static');
    
    if (!fs.existsSync(staticPath)) {
      throw new Error('Build not found. Run "npm run build" first.');
    }
    
    // Check bundle sizes
    const jsPath = path.join(staticPath, 'js');
    const cssPath = path.join(staticPath, 'css');
    
    let totalJsSize = 0;
    let totalCssSize = 0;
    
    if (fs.existsSync(jsPath)) {
      const jsFiles = fs.readdirSync(jsPath);
      for (const file of jsFiles) {
        const filePath = path.join(jsPath, file);
        const stats = fs.statSync(filePath);
        totalJsSize += stats.size;
      }
    }
    
    if (fs.existsSync(cssPath)) {
      const cssFiles = fs.readdirSync(cssPath);
      for (const file of cssFiles) {
        const filePath = path.join(cssPath, file);
        const stats = fs.statSync(filePath);
        totalCssSize += stats.size;
      }
    }
    
    const totalSize = totalJsSize + totalCssSize;
    const maxSize = 2 * 1024 * 1024; // 2MB limit
    
    if (totalSize > maxSize) {
      log(`Bundle size warning: ${(totalSize / 1024 / 1024).toFixed(2)}MB exceeds recommended 2MB`, 'warning');
    }
    
    log(`Bundle sizes - JS: ${(totalJsSize / 1024).toFixed(2)}KB, CSS: ${(totalCssSize / 1024).toFixed(2)}KB`, 'info');
    log('Performance metrics test passed', 'success');
    results.passed++;
    results.tests.push({ 
      name: 'Performance Metrics', 
      status: 'passed',
      metrics: {
        jsSize: totalJsSize,
        cssSize: totalCssSize,
        totalSize: totalSize
      }
    });
  } catch (error) {
    log(`Performance metrics test failed: ${error.message}`, 'error');
    results.failed++;
    results.tests.push({ name: 'Performance Metrics', status: 'failed', error: error.message });
  }
};

const generateReport = () => {
  log('Generating test report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.passed + results.failed,
      passed: results.passed,
      failed: results.failed,
      successRate: ((results.passed / (results.passed + results.failed)) * 100).toFixed(2)
    },
    tests: results.tests,
    config: config
  };
  
  const reportPath = path.join(__dirname, '..', 'integration-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`Test report saved to: ${reportPath}`, 'info');
  
  // Console summary
  console.log('\n' + '='.repeat(50));
  console.log('INTEGRATION TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Success Rate: ${report.summary.successRate}%`);
  console.log('='.repeat(50) + '\n');
  
  return report;
};

// Main execution
const main = async () => {
  log('Starting integration tests...');
  
  try {
    await testEnvironmentConfiguration();
    await testFrontendBuild();
    await testApiConnectivity();
    await testAuthEndpoints();
    await testNotesEndpoints();
    await testPerformanceMetrics();
    
    const report = generateReport();
    
    if (results.failed > 0) {
      log(`Integration tests completed with ${results.failed} failures`, 'error');
      process.exit(1);
    } else {
      log('All integration tests passed!', 'success');
      process.exit(0);
    }
  } catch (error) {
    log(`Integration test suite failed: ${error.message}`, 'error');
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  testApiConnectivity,
  testAuthEndpoints,
  testNotesEndpoints,
  testFrontendBuild,
  testEnvironmentConfiguration,
  testPerformanceMetrics
};