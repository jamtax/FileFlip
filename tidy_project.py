#!/usr/bin/env python3
"""
Project Organization Script for FlipFile

This script organizes files in the current directory into appropriate folders
based on their file types and names.
"""

import os
import shutil
import re
from pathlib import Path

def ensure_directory(directory_path):
    """Create directory if it doesn't exist."""
    if not os.path.exists(directory_path):
        os.makedirs(directory_path)
        print(f"Created directory: {directory_path}")

def move_file(source, destination):
    """Move a file from source to destination."""
    if os.path.exists(destination):
        print(f"Warning: File already exists at {destination}. Skipping.")
        return
    
    try:
        shutil.move(source, destination)
        print(f"Moved: {source} -> {destination}")
    except Exception as e:
        print(f"Error moving {source}: {e}")

def main():
    # Define the project directories
    project_root = os.getcwd()
    directories = {
        'backend': os.path.join(project_root, 'backend'),
        'frontend': os.path.join(project_root, 'frontend'),
        'docs': os.path.join(project_root, 'docs'),
        'assets': os.path.join(project_root, 'frontend', 'public', 'assets'),
        'configs': os.path.join(project_root, 'configs'),
    }
    
    # Create subdirectories
    for directory in directories.values():
        ensure_directory(directory)
    
    # Create additional frontend subdirectories
    frontend_dirs = [
        os.path.join(directories['frontend'], 'src'),
        os.path.join(directories['frontend'], 'src', 'components'),
        os.path.join(directories['frontend'], 'src', 'pages'),
        os.path.join(directories['frontend'], 'src', 'styles'),
        os.path.join(directories['frontend'], 'src', 'services'),
        os.path.join(directories['frontend'], 'src', 'utils'),
    ]
    
    for directory in frontend_dirs:
        ensure_directory(directory)
    
    # Create backend subdirectories
    backend_dirs = [
        os.path.join(directories['backend'], 'converter'),
        os.path.join(directories['backend'], 'utils'),
    ]
    
    for directory in backend_dirs:
        ensure_directory(directory)
    
    # Fix the "rontend" typo folder
    rontend_dir = os.path.join(project_root, 'rontend')
    if os.path.exists(rontend_dir) and os.path.isdir(rontend_dir):
        try:
            # Move any contents to the correct frontend folder
            for item in os.listdir(rontend_dir):
                src_path = os.path.join(rontend_dir, item)
                dst_path = os.path.join(directories['frontend'], item)
                if not os.path.exists(dst_path):
                    shutil.move(src_path, dst_path)
                    print(f"Moved from typo folder: {src_path} -> {dst_path}")
            
            # Remove the empty directory
            os.rmdir(rontend_dir)
            print(f"Removed typo directory: {rontend_dir}")
        except Exception as e:
            print(f"Error fixing 'rontend' directory: {e}")
    
    # Process each file in the root directory
    for filename in os.listdir(project_root):
        file_path = os.path.join(project_root, filename)
        
        # Skip directories and the script itself
        if os.path.isdir(file_path) or filename == os.path.basename(__file__):
            continue
            
        # Sort files by type and name patterns
        lowercase_name = filename.lower()
        
        # Backend Python files
        if lowercase_name.endswith('.py') and any(x in lowercase_name for x in ['backend', 'api', 'pdf-converter', 'app']):
            if 'app' in lowercase_name:
                destination = os.path.join(directories['backend'], 'app.py')
            elif 'pdf' in lowercase_name:
                destination = os.path.join(directories['backend'], 'converter', 'pdf_converter.py')
            elif 'api' in lowercase_name:
                destination = os.path.join(directories['backend'], 'api.py')
            else:
                destination = os.path.join(directories['backend'], filename)
            move_file(file_path, destination)
            
        # Frontend files
        elif any(lowercase_name.endswith(ext) for ext in ['.ts', '.tsx', '.js', '.jsx']) or 'frontend' in lowercase_name:
            if 'component' in lowercase_name:
                # Convert kebab-case to PascalCase for component files
                component_name = ''.join(word.capitalize() for word in re.sub(r'[-_]component.*', '', lowercase_name).split('-')) + '.tsx'
                destination = os.path.join(directories['frontend'], 'src', 'components', component_name)
            elif 'page' in lowercase_name:
                page_name = ''.join(word.capitalize() for word in re.sub(r'[-_]page.*', '', lowercase_name).split('-')) + '.tsx'
                destination = os.path.join(directories['frontend'], 'src', 'pages', page_name)
            elif 'app.tsx' in lowercase_name or 'app-tsx' in lowercase_name:
                destination = os.path.join(directories['frontend'], 'src', 'App.tsx')
            elif 'service' in lowercase_name:
                service_name = ''.join(word.capitalize() for word in re.sub(r'[-_]service.*', '', lowercase_name).split('-')) + 'Service.ts'
                destination = os.path.join(directories['frontend'], 'src', 'services', service_name)
            elif 'style' in lowercase_name or lowercase_name.endswith('.scss') or lowercase_name.endswith('.css'):
                destination = os.path.join(directories['frontend'], 'src', 'styles', filename)
            else:
                destination = os.path.join(directories['frontend'], 'src', filename)
            move_file(file_path, destination)
            
        # Assets (SVG, images)
        elif any(lowercase_name.endswith(ext) for ext in ['.svg', '.png', '.jpg', '.jpeg', '.gif']):
            destination = os.path.join(directories['assets'], filename)
            move_file(file_path, destination)
            
        # Documentation
        elif any(lowercase_name.endswith(ext) for ext in ['.md', '.pdf', '.txt']) and not lowercase_name.startswith('package'):
            destination = os.path.join(directories['docs'], filename)
            move_file(file_path, destination)
            
        # Configuration files
        elif any(pattern in lowercase_name for pattern in ['package', 'config', '.json', 'tailwind', 'requirement']):
            if 'package' in lowercase_name and lowercase_name.endswith('.json'):
                destination = os.path.join(directories['frontend'], 'package.json')
            elif 'tailwind' in lowercase_name:
                destination = os.path.join(directories['frontend'], 'tailwind.config.js')
            elif 'requirement' in lowercase_name:
                destination = os.path.join(directories['backend'], 'requirements.txt')
            else:
                destination = os.path.join(directories['configs'], filename)
            move_file(file_path, destination)
        
        # Keep .gitignore in the root
        elif filename == '.gitignore':
            continue
            
        # Everything else goes to configs for review
        else:
            destination = os.path.join(directories['configs'], filename)
            move_file(file_path, destination)
    
    print("\nProject organization complete!")
    print("Please review the organized files and make any necessary adjustments.")
    print("\nNote: You may need to update import paths in your code after this reorganization.")

if __name__ == "__main__":
    main()