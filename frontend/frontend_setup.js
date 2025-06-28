#!/usr/bin/env node
/**
 * Frontend Setup Script for FlipFile
 * 
 * This script sets up the frontend environment, installs dependencies,
 * runs tests, and starts the development server.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const projectRoot = process.cwd();
const frontendDir = path.join(projectRoot, 'frontend');

// Print colorful output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function printHeading(text) {
  console.log(`\n${colors.blue}--- ${text} ---${colors.reset}`);
}

function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

function printWarning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

function runCommand(command, cwd = projectRoot) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    printError(`Command failed: ${command}`);
    return false;
  }
}

async function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Check Node.js and npm versions
function checkNodeVersion() {
  printHeading('Checking Node.js Version');
  
  try {
    const nodeVersion = execSync('node -v').toString().trim();
    const npmVersion = execSync('npm -v').toString().trim();
    
    console.log(`Node.js version: ${nodeVersion}`);
    console.log(`npm version: ${npmVersion}`);
    
    const versionNumber = nodeVersion.substring(1).split('.');
    const major = parseInt(versionNumber[0], 10);
    
    if (major < 14) {
      printWarning('Recommended Node.js version is 14 or higher.');
      return false;
    }
    
    printSuccess('Node.js version check passed');
    return true;
  } catch (error) {
    printError('Failed to check Node.js version. Make sure Node.js is installed.');
    return false;
  }
}

// Verify package.json exists and has necessary fields
async function verifyPackageJson() {
  printHeading('Verifying package.json');
  
  const packageJsonPath = path.join(frontendDir, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    printWarning('package.json not found in frontend directory.');
    
    const rootPackageJsonPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(rootPackageJsonPath)) {
      printWarning('Found package.json in root directory. Copying to frontend directory.');
      fs.copyFileSync(rootPackageJsonPath, packageJsonPath);
      printSuccess('Copied package.json to frontend directory');
    } else {
      printWarning('Creating a basic package.json file');
      
      const packageJson = {
        name: 'fileflip-frontend',
        version: '0.1.0',
        private: true,
        dependencies: {
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          'react-scripts': '5.0.1',
          'axios': '^1.3.4',
          'tailwindcss': '^3.3.0',
          '@tailwindcss/forms': '^0.5.3'
        },
        scripts: {
          'start': 'react-scripts start',
          'build': 'react-scripts build',
          'test': 'react-scripts test',
          'eject': 'react-scripts eject'
        },
        eslintConfig: {
          extends: ['react-app']
        },
        browserslist: {
          production: ['>0.2%', 'not dead', 'not op_mini all'],
          development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version']
        }
      };
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      printSuccess('Created basic package.json file');
    }
  } else {
    printSuccess('package.json found in frontend directory');
  }
  
  // Verify package.json has required scripts
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    
    if (!packageJson.scripts || !packageJson.scripts.start) {
      printWarning('package.json is missing the "start" script');
      
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts.start = packageJson.scripts.start || 'react-scripts start';
      packageJson.scripts.build = packageJson.scripts.build || 'react-scripts build';
      packageJson.scripts.test = packageJson.scripts.test || 'react-scripts test';
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      printSuccess('Updated package.json with required scripts');
    }
  } catch (error) {
    printError(`Failed to verify package.json: ${error.message}`);
  }
  
  return true;
}

// Install dependencies
async function installDependencies() {
  printHeading('Installing Frontend Dependencies');
  
  // Check if node_modules exists
  const nodeModulesPath = path.join(frontendDir, 'node_modules');
  
  if (fs.existsSync(nodeModulesPath)) {
    const answer = await prompt('node_modules directory already exists. Reinstall dependencies? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      printSuccess('Skipping dependency installation');
      return true;
    }
  }
  
  if (runCommand('npm install', frontendDir)) {
    printSuccess('Dependencies installed successfully');
    return true;
  } else {
    printError('Failed to install dependencies');
    return false;
  }
}

// Verify src directory structure
function verifySrcStructure() {
  printHeading('Verifying Frontend Source Structure');
  
  const srcDir = path.join(frontendDir, 'src');
  
  if (!fs.existsSync(srcDir)) {
    printWarning('src directory not found. Creating basic structure...');
    fs.mkdirSync(srcDir, { recursive: true });
  }
  
  // Create necessary subdirectories
  const dirs = [
    'components',
    'pages',
    'services',
    'styles',
    'utils'
  ];
  
  dirs.forEach(dir => {
    const dirPath = path.join(srcDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      printSuccess(`Created ${dir} directory`);
    }
  });
  
  // Check for index file
  const indexPath = path.join(srcDir, 'index.tsx');
  if (!fs.existsSync(indexPath)) {
    printWarning('index.tsx not found. Creating basic file...');
    
    const indexContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
    
    fs.writeFileSync(indexPath, indexContent);
    printSuccess('Created basic index.tsx file');
  }
  
  // Check for App file
  const appPath = path.join(srcDir, 'App.tsx');
  if (!fs.existsSync(appPath)) {
    printWarning('App.tsx not found. Creating basic file...');
    
    const appContent = `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">FileFlip</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <p className="text-gray-500">Welcome to FileFlip! Frontend is running successfully.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
`;
    
    fs.writeFileSync(appPath, appContent);
    printSuccess('Created basic App.tsx file');
  }
  
  return true;
}

// Run frontend tests
function runTests() {
  printHeading('Running Frontend Tests');
  
  try {
    execSync('npm test -- --watchAll=false', { cwd: frontendDir, stdio: 'inherit' });
    printSuccess('Tests completed');
    return true;
  } catch (error) {
    printWarning('Tests failed or no tests found. This is not critical for development.');
    return true;
  }
}

// Start frontend development server
function startDevServer() {
  printHeading('Starting Frontend Development Server');
  
  console.log('Starting React development server...');
  
  const server = spawn('npm', ['start'], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true
  });
  
  server.on('error', (error) => {
    printError(`Failed to start development server: ${error.message}`);
  });
  
  process.on('SIGINT', () => {
    server.kill('SIGINT');
    process.exit();
  });
}

// Main function
async function main() {
  console.log(`${colors.blue}=== FlipFile Frontend Setup and Development ===\n${colors.reset}`);
  
  // Check Node.js version
  if (!checkNodeVersion()) {
    const answer = await prompt('Continue anyway? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      rl.close();
      return;
    }
  }
  
  // Verify package.json
  await verifyPackageJson();
  
  // Install dependencies
  if (!await installDependencies()) {
    printError('Failed to install dependencies. Trying to continue...');
  }
  
  // Verify src structure
  verifySrcStructure();
  
  // Run tests
  runTests();
  
  // Start development server
  startDevServer();
  
  // Keep readline interface open for the server
}

// Run the script
main().catch(error => {
  printError(`An error occurred: ${error.message}`);
  rl.close();
});