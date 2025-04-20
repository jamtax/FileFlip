#!/usr/bin/env python3
"""
FlipFile Project Runner - Patched Version

This script fixes the issue with the backend_setup.py file not being found.
"""

import os
import sys
import subprocess
import time
import webbrowser
import platform
from pathlib import Path

# Global variables
PROJECT_ROOT = os.getcwd()
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
FRONTEND_DIR = os.path.join(PROJECT_ROOT, 'frontend')

# Terminal colors for better output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(message):
    """Print a formatted header message."""
    print(f"\n{Colors.HEADER}{Colors.BOLD}=== {message} ==={Colors.END}\n")

def print_step(message):
    """Print a formatted step message."""
    print(f"{Colors.BLUE}>>> {message}{Colors.END}")

def print_success(message):
    """Print a success message."""
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_warning(message):
    """Print a warning message."""
    print(f"{Colors.YELLOW}⚠ {message}{Colors.END}")

def print_error(message):
    """Print an error message."""
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def run_command(command, cwd=None, shell=False, timeout=60):
    """Run a command and return the result with a timeout."""
    try:
        if isinstance(command, str) and not shell:
            command = command.split()
        
        result = subprocess.run(
            command,
            cwd=cwd,
            shell=shell,
            text=True,
            capture_output=True,
            timeout=timeout  # Added timeout to prevent hanging
        )
        
        if result.returncode != 0:
            print_error(f"Command failed: {command}")
            print(f"Error: {result.stderr}")
            return False, result.stderr
        
        return True, result.stdout
    except subprocess.TimeoutExpired:
        print_error(f"Command timed out after {timeout} seconds: {command}")
        return False, "Command timed out"
    except Exception as e:
        print_error(f"Error executing command: {e}")
        return False, str(e)

def check_project_structure():
    """Check if the project structure is valid."""
    print_step("Checking project structure...")
    
    # Check if backend and frontend directories exist
    if not os.path.isdir(BACKEND_DIR):
        print_error(f"Backend directory not found: {BACKEND_DIR}")
        return False
    
    if not os.path.isdir(FRONTEND_DIR):
        print_error(f"Frontend directory not found: {FRONTEND_DIR}")
        return False
    
    print_success("Project structure is valid.")
    return True

def run_backend_setup():
    """Run the backend setup script."""
    # Create a temporary backend setup script
    setup_script = os.path.join(PROJECT_ROOT, 'temp_backend_setup.py')
    
    print_warning("Creating temporary backend setup script...")
        
    # Create the backend setup script with the content from your first file
    script_content = """#!/usr/bin/env python3
\"\"\"
Backend Setup Script for FlipFile

This script sets up the backend environment, installs dependencies,
and runs tests to verify functionality.
\"\"\"

import os
import subprocess
import sys
import platform

def run_command(command, cwd=None):
    \"\"\"Run a shell command and print output.\"\"\"
    print(f"Running: {' '.join(command)}")
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            check=True,
            text=True,
            capture_output=True
        )
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {' '.join(command)}")
        print(f"Error output: {e.stderr}")
        return False

def check_python():
    \"\"\"Check Python version.\"\"\"
    print("\\n--- Checking Python Version ---")
    python_version = platform.python_version()
    print(f"Python version: {python_version}")
    
    major, minor, _ = map(int, python_version.split('.'))
    if major < 3 or (major == 3 and minor < 8):
        print("Warning: Recommended Python version is 3.8 or higher.")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)

def setup_venv():
    \"\"\"Set up a virtual environment.\"\"\"
    print("\\n--- Setting Up Virtual Environment ---")
    backend_dir = os.path.join(os.getcwd(), 'backend')
    venv_dir = os.path.join(backend_dir, 'venv')
    
    if not os.path.exists(venv_dir):
        # Create virtual environment
        if not run_command([sys.executable, '-m', 'venv', venv_dir], cwd=backend_dir):
            print("Failed to create virtual environment.")
            return False
    else:
        print("Virtual environment already exists.")
    
    # Determine the path to pip and python in the virtual environment
    if platform.system() == 'Windows':
        pip_path = os.path.join(venv_dir, 'Scripts', 'pip')
        python_path = os.path.join(venv_dir, 'Scripts', 'python')
    else:
        pip_path = os.path.join(venv_dir, 'bin', 'pip')
        python_path = os.path.join(venv_dir, 'bin', 'python')
    
    # Install dependencies
    requirements_path = os.path.join(backend_dir, 'requirements.txt')
    if os.path.exists(requirements_path):
        print("Installing dependencies from requirements.txt...")
        if not run_command([pip_path, 'install', '-r', requirements_path], cwd=backend_dir):
            print("Failed to install dependencies.")
            return False
    else:
        print("Warning: requirements.txt not found. Installing common dependencies...")
        if not run_command([pip_path, 'install', 'fastapi', 'uvicorn', 'pydantic', 'python-multipart', 'PyPDF2', 'pytest'], cwd=backend_dir):
            print("Failed to install common dependencies.")
            return False
            
    return python_path

def run_backend_tests(python_path):
    \"\"\"Run backend tests.\"\"\"
    print("\\n--- Running Backend Tests ---")
    backend_dir = os.path.join(os.getcwd(), 'backend')
    
    # Check if pytest is installed
    if not run_command([python_path, '-m', 'pytest', '--version'], cwd=backend_dir):
        print("Installing pytest...")
        pip_path = os.path.dirname(python_path)
        pip_path = os.path.join(pip_path, 'pip')
        run_command([pip_path, 'install', 'pytest'], cwd=backend_dir)
    
    # Create basic test if none exists
    test_dir = os.path.join(backend_dir, 'tests')
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)
        test_file = os.path.join(test_dir, 'test_basic.py')
        
        with open(test_file, 'w') as f:
            f.write('''
def test_basic():
    \"\"\"Basic test to verify testing setup.\"\"\"
    assert True
''')
        print(f"Created basic test at {test_file}")
    
    # Run tests
    run_command([python_path, '-m', 'pytest'], cwd=backend_dir)

def start_backend_server(python_path):
    \"\"\"Start the backend server.\"\"\"
    print("\\n--- Starting Backend Server ---")
    backend_dir = os.path.join(os.getcwd(), 'backend')
    
    # Check if app.py exists
    app_path = os.path.join(backend_dir, 'app.py')
    if not os.path.exists(app_path):
        print(f"Warning: {app_path} not found. Looking for alternative entry points...")
        
        # Look for alternative entry points
        for file in os.listdir(backend_dir):
            if file.endswith('.py') and 'app' in file.lower():
                app_path = os.path.join(backend_dir, file)
                break
        
        if not os.path.exists(app_path):
            print("No suitable entry point found. Cannot start backend server.")
            return False
    
    # Start uvicorn server
    print(f"Starting server with {app_path}")
    try:
        subprocess.Popen([python_path, '-m', 'uvicorn', 'app:app', '--reload'], 
                        cwd=backend_dir)
        print("Backend server started at http://127.0.0.1:8000")
        return True
    except Exception as e:
        print(f"Failed to start backend server: {e}")
        return False

def main():
    \"\"\"Main function to set up and test the backend.\"\"\"
    print("\\n=== FlipFile Backend Setup and Test ===")
    
    # Check Python version
    check_python()
    
    # Setup virtual environment and get Python path
    python_path = setup_venv()
    if not python_path:
        print("Failed to set up virtual environment.")
        return
    
    # Run backend tests
    run_backend_tests(python_path)
    
    # Start backend server
    start_backend_server(python_path)
    
    print("\\nBackend setup and testing completed.")
    print("You can now test the API endpoints at http://127.0.0.1:8000/docs")

if __name__ == "__main__":
    main()
"""
    
    # Write the script to the destination
    with open(setup_script, 'w') as f:
        f.write(script_content)
    
    # Make the script executable
    os.chmod(setup_script, 0o755)
    
    # Run the backend setup script with a timeout
    print_step("Running backend setup...")
    success, output = run_command([sys.executable, setup_script], cwd=PROJECT_ROOT, timeout=180)
    
    # Clean up the temporary script
    os.remove(setup_script)
    
    if success:
        print_success("Backend setup completed successfully.")
        return True
    else:
        print_error("Backend setup failed.")
        print(f"Error details: {output}")
        return False

def run_frontend_setup():
    """Run the frontend setup script."""
    # Create a temporary frontend setup script
    setup_script = os.path.join(PROJECT_ROOT, 'temp_frontend_setup.js')
    
    print_warning("Creating temporary frontend setup script...")
    
    # Get the script content from your second file
    script_content = """#!/usr/bin/env node
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
  reset: '\\x1b[0m',
  green: '\\x1b[32m',
  yellow: '\\x1b[33m',
  red: '\\x1b[31m',
  blue: '\\x1b[34m'
};

function printHeading(text) {
  console.log(`\\n${colors.blue}--- ${text} ---${colors.reset}`);
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
  console.log(`${colors.blue}=== FlipFile Frontend Setup and Development ===\\n${colors.reset}`);
  
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
"""
    
    # Write the script to the destination
    with open(setup_script, 'w') as f:
        f.write(script_content)
    
    # Make the script executable
    os.chmod(setup_script, 0o755)
    
    # Run the frontend setup script with a timeout
    print_step("Running frontend setup...")
    
    # Check if Node.js is installed
    success, _ = run_command("node --version", timeout=30)
    if not success:
        print_error("Node.js is not installed. Please install Node.js to run the frontend.")
        return False
    
    # Run the frontend setup script with Node.js
    success, output = run_command(["node", setup_script], cwd=PROJECT_ROOT, timeout=180)
    
    # Clean up the temporary script
    os.remove(setup_script)
    
    if success:
        print_success("Frontend setup completed successfully.")
        return True
    else:
        print_error("Frontend setup failed.")
        print(f"Error details: {output}")
        return False

def start_backend_server():
    """Start the backend server."""
    print_step("Starting backend server...")
    
    # Determine Python executable path (using venv if available)
    python_exec = sys.executable
    venv_python = os.path.join(BACKEND_DIR, 'venv', 'Scripts' if platform.system() == 'Windows' else 'bin', 'python')
    
    if os.path.isfile(venv_python):
        python_exec = venv_python
    
    # Check for the main app file
    app_file = os.path.join(BACKEND_DIR, 'app.py')
    if not os.path.isfile(app_file):
        # Look for alternatives
        for file in os.listdir(BACKEND_DIR):
            if file.lower().endswith('.py') and 'app' in file.lower():
                app_file = os.path.join(BACKEND_DIR, file)
                break
    
    if not os.path.isfile(app_file):
        print_error("Could not find the main backend application file.")
        return None
    
    # Start the uvicorn server as a subprocess
    app_module = os.path.splitext(os.path.basename(app_file))[0]
    cmd = [python_exec, "-m", "uvicorn", f"{app_module}:app", "--reload", "--host", "127.0.0.1", "--port", "8000"]
    
    try:
        process = subprocess.Popen(
            cmd,
            cwd=BACKEND_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a moment to make sure the server starts
        time.sleep(2)
        
        # Check if the process is still running
        if process.poll() is None:
            print_success("Backend server started successfully at http://127.0.0.1:8000")
            return process
        else:
            stderr = process.stderr.read()
            print_error(f"Backend server failed to start: {stderr}")
            return None
    except Exception as e:
        print_error(f"Error starting backend server: {e}")
        return None

def start_frontend_server():
    """Start the frontend development server."""
    print_step("Starting frontend development server...")
    
    # Start the npm development server as a subprocess
    cmd = "npm start"
    
    try:
        process = subprocess.Popen(
            cmd,
            cwd=FRONTEND_DIR,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a moment to make sure the server starts
        time.sleep(5)
        
        # Check if the process is still running
        if process.poll() is None:
            print_success("Frontend development server started successfully at http://localhost:3000")
            return process
        else:
            stderr = process.stderr.read()
            print_error(f"Frontend server failed to start: {stderr}")
            return None
    except Exception as e:
        print_error(f"Error starting frontend server: {e}")
        return None

def open_browser():
    """Open web browser with the application."""
    print_step("Opening application in web browser...")
    
    try:
        # First open the frontend
        webbrowser.open("http://localhost:3000")
        time.sleep(1)
        
        # Then open the backend API docs
        webbrowser.open("http://127.0.0.1:8000/docs")
        
        print_success("Opened application in web browser.")
    except Exception as e:
        print_error(f"Error opening browser: {e}")

def check_for_errors(processes):
    """Check for errors in the running processes."""
    for name, process in processes.items():
        if process and process.poll() is not None:
            stdout, stderr = process.communicate()
            print_error(f"{name} process has terminated unexpectedly.")
            if stderr:
                print_error(f"Error output: {stderr}")
            return False
    return True

def main():
    """Main function to run the project."""
    print_header("FlipFile Project Runner")
    
    # Check project structure
    if not check_project_structure():
        response = input("Project structure is invalid. Do you want to continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Run setup scripts
    backend_setup_success = run_backend_setup()
    frontend_setup_success = run_frontend_setup()
    
    if not backend_setup_success and not frontend_setup_success:
        print_error("Both backend and frontend setup failed. Cannot continue.")
        sys.exit(1)
    
    # Start servers
    processes = {}
    
    if backend_setup_success:
        backend_process = start_backend_server()
        if backend_process:
            processes['backend'] = backend_process
    
    if frontend_setup_success:
        frontend_process = start_frontend_server()
        if frontend_process:
            processes['frontend'] = frontend_process
    
    if not processes:
        print_error("No servers could be started. Exiting.")
        sys.exit(1)
    
    # Open browser
    if 'frontend' in processes or 'backend' in processes:
        open_browser()
    
    print_header("Development Environment Running")
    print("Press Ctrl+C to stop all servers and exit")
    
    try:
        # Keep checking the processes
        while check_for_errors(processes):
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        
        # Terminate all processes
        for name, process in processes.items():
            if process:
                try:
                    process.terminate()
                    print_success(f"{name} server shutdown complete.")
                except:
                    print_warning(f"Could not cleanly terminate {name} server.")
        
        print_success("All servers have been shutdown.")
        
    print_header("FlipFile Project Runner Exited")

if __name__ == "__main__":
    main()