#!/usr/bin/env node

/**
 * Test runner for the Regex Find extension
 * This script installs dependencies and runs all tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Regex Find Extension Test Runner\n');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully\n');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Run tests
console.log('🏃 Running tests...\n');

try {
  // Run all tests
  execSync('npm test', { stdio: 'inherit' });
  console.log('\n✅ All tests passed!');
  
  // Run coverage if requested
  if (process.argv.includes('--coverage')) {
    console.log('\n📊 Generating coverage report...');
    execSync('npm run test:coverage', { stdio: 'inherit' });
  }
  
} catch (error) {
  console.error('\n❌ Some tests failed');
  process.exit(1);
}
