#!/usr/bin/env python3
"""
FlipFile Project Runner (Simplified Version)

This script serves as a central command to run, test, and debug the FlipFile project.
It directly sets up the environment without using temporary scripts.
"""

import os
import sys
import subprocess
import time
import webbrowser
import platform
import venv
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
    """Run a command and return the result."""
    try:
        if isinstance(command, str) and not shell:
            command = command.split()
        
        print(f"Running command: {command}")
        result = subprocess.run(
            command,
            cwd=cwd,
            shell=shell,
            text=True,
            capture_output=True,
            timeout=timeout
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

def setup_backend():
    """Set up the backend environment."""
    print_step("Setting up backend environment...")
    
    # Check Python version
    python_version = platform.python_version()
    print(f"Using Python version: {python_version}")
    
    # Setup virtual environment
    venv_dir = os.path.join(BACKEND_DIR, 'venv')
    if not os.path.exists(venv_dir):
        print(f"Creating virtual environment at {venv_dir}")
        try:
            venv.create(venv_dir, with_pip=True)
            print_success("Virtual environment created successfully")
        except Exception as e:
            print_error(f"Failed to create virtual environment: {e}")
            return False
    else:
        print("Using existing virtual environment")
    
    # Determine the path to pip and python in the virtual environment
    if platform.system() == 'Windows':
        pip_path = os.path.join(venv_dir, 'Scripts', 'pip')
        python_path = os.path.join(venv_dir, 'Scripts', 'python')
    else:
        pip_path = os.path.join(venv_dir, 'bin', 'pip')
        python_path = os.path.join(venv_dir, 'bin', 'python')
    
    # Install dependencies
    print("Installing backend dependencies...")
    requirements_path = os.path.join(BACKEND_DIR, 'requirements.txt')
    if os.path.exists(requirements_path):
        success, output = run_command([pip_path, 'install', '-r', requirements_path], cwd=BACKEND_DIR, timeout=180)
        if not success:
            print_error(f"Failed to install backend dependencies: {output}")
            return False
    else:
        print_warning("requirements.txt not found, installing common packages...")
        common_packages = ['fastapi', 'uvicorn', 'pydantic', 'python-multipart', 'PyPDF2', 'pytest']
        success, output = run_command([pip_path, 'install'] + common_packages, cwd=BACKEND_DIR, timeout=180)
        if not success:
            print_error(f"Failed to install common packages: {output}")
            return False
    
    print_success("Backend environment setup completed")
    return python_path

def setup_frontend():
    """Set up the frontend environment."""
    print_step("Setting up frontend environment...")
    
    # Check if Node.js is installed
    success, output = run_command("node --version", timeout=10)
    if not success:
        print_error("Node.js is not installed. Please install Node.js to run the frontend.")
        return False
    
    npm_version_success, npm_output = run_command("npm --version", timeout=10)
    if not npm_version_success:
        print_error("npm is not installed. Please install npm to run the frontend.")
        return False
    
    print(f"Using Node.js: {output.strip()}, npm: {npm_output.strip()}")
    
    # Check for package.json
    package_json_path = os.path.join(FRONTEND_DIR, 'package.json')
    if not os.path.exists(package_json_path):
        print_warning("package.json not found in frontend directory. Creating a basic one...")
        
        # Create a basic package.json
        package_json = {
            "name": "fileflip-frontend",
            "version": "0.1.0",
            "private": True,
            "dependencies": {
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "react-scripts": "5.0.1",
                "axios": "^1.3.4",
                "tailwindcss": "^3.3.0"
            },
            "scripts": {
                "start": "react-scripts start",
                "build": "react-scripts build",
                "test": "react-scripts test",
                "eject": "react-scripts eject"
            },
            "eslintConfig": {
                "extends": ["react-app"]
            },
            "browserslist": {
                "production": [">0.2%", "not dead", "not op_mini all"],
                "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
            }
        }
        
        import json
        with open(package_json_path, 'w') as f:
            json.dump(package_json, f, indent=2)
            
        print_success("Created basic package.json file")
    
    # Ensure src directory exists
    src_dir = os.path.join(FRONTEND_DIR, 'src')
    if not os.path.exists(src_dir):
        os.makedirs(src_dir, exist_ok=True)
        
        # Create basic App.tsx
        app_content = """import React from 'react';

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
"""
        with open(os.path.join(src_dir, 'App.tsx'), 'w') as f:
            f.write(app_content)
        
        # Create basic index.tsx
        index_content = """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"""
        with open(os.path.join(src_dir, 'index.tsx'), 'w') as f:
            f.write(index_content)
            
        print_success("Created basic React application files")
    
    # Ask about installing dependencies
    if os.path.exists(os.path.join(FRONTEND_DIR, 'node_modules')):
        print("node_modules directory already exists. Skipping npm install.")
    else:
        print("Installing frontend dependencies (this may take a while)...")
        success, output = run_command("npm install", cwd=FRONTEND_DIR, shell=True, timeout=300)
        if not success:
            print_error(f"Failed to install frontend dependencies: {output}")
            return False
    
    print_success("Frontend environment setup completed")
    return True

def start_backend_server(python_path):
    """Start the backend server."""
    print_step("Starting backend server...")
    
    # Check for the main app file
    app_file = os.path.join(BACKEND_DIR, 'app.py')
    if not os.path.isfile(app_file):
        # Look for alternatives
        for file in os.listdir(BACKEND_DIR):
            if file.lower().endswith('.py') and 'app' in file.lower():
                app_file = os.path.join(BACKEND_DIR, file)
                break
    
    if not os.path.isfile(app_file):
        # Create a basic FastAPI app.py
        app_content = """from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="FileFlip API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def read_root():
    return {"message": "Welcome to FileFlip API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "status": "File received but processing not implemented yet"
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
"""
        app_file = os.path.join(BACKEND_DIR, 'app.py')
        with open(app_file, 'w') as f:
            f.write(app_content)
        print_success("Created basic FastAPI app.py file")
    
    # Start the uvicorn server as a subprocess
    app_module = os.path.splitext(os.path.basename(app_file))[0]
    cmd = [python_path, "-m", "uvicorn", f"{app_module}:app", "--reload", "--host", "127.0.0.1", "--port", "8000"]
    
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
    
    # Setup backend and get Python path
    python_path = setup_backend()
    if not python_path:
        print_error("Backend setup failed.")
        # Continue anyway to try frontend
        backend_setup_success = False
    else:
        backend_setup_success = True
    
    # Setup frontend
    frontend_setup_success = setup_frontend()
    
    if not backend_setup_success and not frontend_setup_success:
        print_error("Both backend and frontend setup failed. Cannot continue.")
        sys.exit(1)
    
    # Start servers
    processes = {}
    
    if backend_setup_success:
        backend_process = start_backend_server(python_path)
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