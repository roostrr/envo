#!/usr/bin/env node
/**
 * Test script to verify Node.js server startup
 */

const fs = require('fs');
const path = require('path');

function checkFiles() {
    console.log('Checking required files...');
    
    const requiredFiles = [
        'server.js',
        'package.json',
        'routes/auth.js',
        'routes/users.js',
        'routes/admin.js',
        'routes/career.js',
        'routes/youtube.js',
        'routes/ai.js',
        'routes/content.js',
        'routes/support.js',
        'routes/summaryFeedback.js',
        'routes/chatFeedback.js'
    ];
    
    let allFilesExist = true;
    
    for (const file of requiredFiles) {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} exists`);
        } else {
            console.log(`❌ ${file} missing`);
            allFilesExist = false;
        }
    }
    
    return allFilesExist;
}

function checkPackageJson() {
    console.log('\nChecking package.json...');
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        if (packageJson.scripts && packageJson.scripts.start) {
            console.log('✅ package.json has start script');
        } else {
            console.log('❌ package.json missing start script');
            return false;
        }
        
        if (packageJson.main) {
            console.log(`✅ package.json has main: ${packageJson.main}`);
        } else {
            console.log('⚠️ package.json missing main field');
        }
        
        return true;
    } catch (error) {
        console.log(`❌ Error reading package.json: ${error.message}`);
        return false;
    }
}

function checkServerFile() {
    console.log('\nChecking server.js...');
    
    try {
        const serverContent = fs.readFileSync('server.js', 'utf8');
        
        // Check for basic Express app setup
        if (serverContent.includes('express')) {
            console.log('✅ server.js uses Express');
        } else {
            console.log('❌ server.js missing Express');
            return false;
        }
        
        // Check for health endpoint
        if (serverContent.includes('/health') || serverContent.includes('/api/health')) {
            console.log('✅ server.js has health endpoint');
        } else {
            console.log('⚠️ server.js missing health endpoint');
        }
        
        // Check for PORT configuration
        if (serverContent.includes('process.env.PORT')) {
            console.log('✅ server.js uses PORT environment variable');
        } else {
            console.log('⚠️ server.js missing PORT environment variable');
        }
        
        return true;
    } catch (error) {
        console.log(`❌ Error reading server.js: ${error.message}`);
        return false;
    }
}

function main() {
    console.log('Node.js Server Startup Test');
    console.log('=' * 50);
    
    const checks = [
        checkFiles,
        checkPackageJson,
        checkServerFile
    ];
    
    let allPassed = true;
    
    for (const check of checks) {
        try {
            if (!check()) {
                allPassed = false;
            }
        } catch (error) {
            console.log(`❌ Check failed with error: ${error.message}`);
            allPassed = false;
        }
    }
    
    console.log('\n' + '=' * 50);
    if (allPassed) {
        console.log('✅ All Node.js server checks passed!');
        console.log('The Node.js server should start successfully.');
        process.exit(0);
    } else {
        console.log('❌ Some Node.js server checks failed.');
        console.log('Please fix the issues before deploying.');
        process.exit(1);
    }
}

main();
