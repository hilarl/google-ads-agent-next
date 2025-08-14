// simple-env-test.js
// Run with: node simple-env-test.js (from project root)
// Or: node scripts/simple-env-test.js (if script is in scripts folder)

console.log('🔍 Simple Environment Variables Test\n');

// Determine the correct path to .env.local
const path = require('path');
const fs = require('fs');

// Check if we're in scripts directory or project root
const currentDir = process.cwd();
const isInScriptsDir = currentDir.endsWith('/scripts') || currentDir.endsWith('\\scripts');
const envPath = isInScriptsDir ? '../.env.local' : '.env.local';

console.log(`📍 Current directory: ${currentDir}`);
console.log(`📍 Looking for .env.local at: ${path.resolve(envPath)}`);

// Load dotenv with correct path
try {
  require('dotenv').config({ path: envPath });
  console.log('✅ dotenv loaded successfully');
} catch (error) {
  console.log('❌ dotenv failed to load:', error.message);
}

// Check if variables are loaded
const vars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'GOOGLE_REDIRECT_URI',
  'NEXTAUTH_URL',
  'NODE_ENV'
];

console.log('\n📋 Environment Variables Check:');
vars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('SECRET') 
      ? value.substring(0, 10) + '***'
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

// Show all environment variables that start with GOOGLE
console.log('\n🔍 All GOOGLE_* variables:');
Object.keys(process.env)
  .filter(key => key.startsWith('GOOGLE'))
  .forEach(key => {
    const value = process.env[key];
    const displayValue = key.includes('SECRET') 
      ? value.substring(0, 10) + '***'
      : value;
    console.log(`${key}: ${displayValue}`);
  });

// Check if .env.local file exists
console.log('\n📁 File System Check:');
try {
  const stats = fs.statSync(envPath);
  console.log(`✅ .env.local exists at ${path.resolve(envPath)} (${stats.size} bytes)`);
  
  const content = fs.readFileSync(envPath, 'utf8');
  console.log(`📄 First 200 chars: ${content.substring(0, 200)}...`);
  
  // Check for common issues
  if (content.includes('"')) {
    console.log('⚠️  WARNING: Found quotes in .env.local file - these should be removed');
  }
  if (content.includes('your-')) {
    console.log('⚠️  WARNING: Found placeholder values in .env.local file');
  }
  
} catch (error) {
  console.log('❌ .env.local file issue:', error.message);
  
  // Try to find .env.local in parent directory
  try {
    const parentEnvPath = '../.env.local';
    const stats = fs.statSync(parentEnvPath);
    console.log(`ℹ️  Found .env.local in parent directory: ${path.resolve(parentEnvPath)} (${stats.size} bytes)`);
  } catch (parentError) {
    console.log('❌ .env.local not found in parent directory either');
  }
}