#!/usr/bin/env node

/**
 * Build script for Cloudflare Pages
 * 
 * This script replaces environment variable placeholders in HTML files
 * with actual values from environment variables.
 * 
 * Usage:
 *   node build.js
 * 
 * Environment variables required:
 *   - FIREBASE_API_KEY
 *   - FIREBASE_AUTH_DOMAIN
 *   - FIREBASE_PROJECT_ID
 *   - FIREBASE_STORAGE_BUCKET
 *   - FIREBASE_MESSAGING_SENDER_ID
 *   - FIREBASE_APP_ID
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BUILD_DIR = process.env.BUILD_DIR || '.';
const FILES_TO_PROCESS = [
  'index.html',
  'members/yasahime.html',
  'members/kaka.html',
  'members/sokrates.html'
];

// Environment variable mappings
const ENV_MAPPINGS = {
  '%FIREBASE_API_KEY%': process.env.FIREBASE_API_KEY || '',
  '%FIREBASE_AUTH_DOMAIN%': process.env.FIREBASE_AUTH_DOMAIN || '',
  '%FIREBASE_PROJECT_ID%': process.env.FIREBASE_PROJECT_ID || '',
  '%FIREBASE_STORAGE_BUCKET%': process.env.FIREBASE_STORAGE_BUCKET || '',
  '%FIREBASE_MESSAGING_SENDER_ID%': process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  '%FIREBASE_APP_ID%': process.env.FIREBASE_APP_ID || ''
};

/**
 * Replace placeholders in content with environment values
 */
function replacePlaceholders(content) {
  let result = content;
  
  for (const [placeholder, value] of Object.entries(ENV_MAPPINGS)) {
    result = result.split(placeholder).join(value);
  }
  
  return result;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const fullPath = path.join(BUILD_DIR, filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if file contains placeholders
    if (content.includes('%FIREBASE_')) {
      content = replacePlaceholders(content);
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✓ Processed: ${filePath}`);
    } else {
      console.log(`- Skipped (no placeholders): ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Main build function
 */
function build() {
  console.log('Starting build process...');
  console.log('Environment:', {
    hasApiKey: !!process.env.FIREBASE_API_KEY,
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID
  });
  
  // Process each file
  FILES_TO_PROCESS.forEach(processFile);
  
  console.log('Build complete!');
}

// Run build
build();
