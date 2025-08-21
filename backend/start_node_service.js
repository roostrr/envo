#!/usr/bin/env node
/**
 * Startup script for Node.js backend with error handling
 */

const fs = require('fs');
const path = require('path');

// Check if required files exist
function checkRequiredFiles() {
    console.log('Checking required files...');
    
    const requiredFiles = [
        'server.js',
        'package.json'
    ];
    
    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            console.error(`❌ Required file missing: ${file}`);
            return false;
        }
    }
    
    console.log('✅ All required files exist');
    return true;
}

// Check if package.json is valid
function checkPackageJson() {
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        if (!packageJson.scripts || !packageJson.scripts.start) {
            console.error('❌ package.json missing start script');
            return false;
        }
        
        console.log('✅ package.json is valid');
        return true;
    } catch (error) {
        console.error(`❌ Error reading package.json: ${error.message}`);
        return false;
    }
}

// Start the server
function startServer() {
    console.log('Starting Node.js server...');
    
    try {
        // Import and start the server
        require('./server.js');
        console.log('✅ Server started successfully');
    } catch (error) {
        console.error(`❌ Failed to start server: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);
        process.exit(1);
    }
}

// Main function
function main() {
    console.log('Node.js Backend Startup');
    console.log('=' * 50);
    
    // Check files
    if (!checkRequiredFiles()) {
        console.error('❌ File check failed');
        process.exit(1);
    }
    
    // Check package.json
    if (!checkPackageJson()) {
        console.error('❌ Package.json check failed');
        process.exit(1);
    }
    
    // Start server
    startServer();
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

main();
