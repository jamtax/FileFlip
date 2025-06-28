#!/usr/bin/env python3
"""
Backend Setup Script for FlipFile

This script sets up the backend environment, installs dependencies,
and runs tests to verify functionality.
"""

import os
import subprocess
import sys
import platform

def run_command(command, cwd=None):
    """Run a shell command and print output."""
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
    """Check Python version."""
    print("\n--- Checking Python Version ---")
    python_version = platform.python_version()
    print(f"Python version: {python_version}")
    
    major, minor, _ = map(int, python_version.split('.'))
    if major < 3 or (major == 3 and minor < 8):
        print("Warning: Recommended Python version is 3.8 or higher.")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)

def setup_venv():
    """Set up a virtual environment."""
    print("\n--- Setting Up Virtual Environment ---")
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
    """Run backend tests."""
    print("\n--- Running Backend Tests ---")
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
    """Basic test to verify testing setup."""
    assert True
''')
        print(f"Created basic test at {test_file}")
    
    # Run tests
    run_command([python_path, '-m', 'pytest'], cwd=backend_dir)

def start_backend_server(python_path):
    """Start the backend server."""
    print("\n--- Starting Backend Server ---")
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
    """Main function to set up and test the backend."""
    print("\n=== FlipFile Backend Setup and Test ===")
    
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
    
    print("\nBackend setup and testing completed.")
    print("You can now test the API endpoints at http://127.0.0.1:8000/docs")

if __name__ == "__main__":
    main()
