#!/usr/bin/env python3
"""
Frontend Organization Script for FlipFile

This script consolidates all frontend-related files into a single frontend folder.
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
    frontend_dir = os.path.join(project_root, 'frontend')
    
    # Create frontend directory if it doesn't exist
    ensure_directory(frontend_dir)
    
    # Create frontend subdirectories
    frontend_dirs = {
        'src': os.path.join(frontend_dir, 'src'),
        'components': os.path.join(frontend_dir, 'src', 'components'),
        'pages': os.path.join(frontend_dir, 'src', 'pages'),
        'styles': os.path.join(frontend_dir, 'src', 'styles'),
        'services': os.path.join(frontend_dir, 'src', 'services'),
        'utils': os.path.join(frontend_dir, 'src', 'utils'),
        'assets': os.path.join(frontend_dir, 'public', 'assets'),
    }
    
    for directory in frontend_dirs.values():
        ensure_directory(directory)
    
    # If frontend-new exists, copy its contents to frontend
    frontend_new_dir = os.path.join(project_root, 'frontend-new')
    if os.path.exists(frontend_new_dir):
        print(f"Moving contents from {frontend_new_dir} to {frontend_dir}...")
        
        for item in os.listdir(frontend_new_dir):
            src_path = os.path.join(frontend_new_dir, item)
            dst_path = os.path.join(frontend_dir, item)
            
            # If it's a directory
            if os.path.isdir(src_path):
                if os.path.exists(dst_path):
                    # Copy contents instead of overwriting
                    for subitem in os.listdir(src_path):
                        sub_src = os.path.join(src_path, subitem)
                        sub_dst = os.path.join(dst_path, subitem)
                        if not os.path.exists(sub_dst):
                            if os.path.isdir(sub_src):
                                shutil.copytree(sub_src, sub_dst)
                            else:
                                shutil.copy2(sub_src, sub_dst)
                            print(f"Copied: {sub_src} -> {sub_dst}")
                else:
                    # Move the entire directory
                    shutil.copytree(src_path, dst_path)
                    print(f"Copied directory: {src_path} -> {dst_path}")
            # If it's a file
            else:
                if not os.path.exists(dst_path):
                    shutil.copy2(src_path, dst_path)
                    print(f"Copied: {src_path} -> {dst_path}")
    
    # Move package.json and package-lock.json to frontend if they exist in root
    for filename in ['package.json', 'package-lock.json']:
        src_path = os.path.join(project_root, filename)
        dst_path = os.path.join(frontend_dir, filename)
        
        if os.path.exists(src_path) and not os.path.exists(dst_path):
            shutil.copy2(src_path, dst_path)
            print(f"Copied: {src_path} -> {dst_path}")
    
    # Process and move frontend component files from root
    for filename in os.listdir(project_root):
        file_path = os.path.join(project_root, filename)
        
        # Skip directories and the script itself
        if os.path.isdir(file_path) or filename == os.path.basename(__file__):
            continue
            
        # Process frontend files
        lowercase_name = filename.lower()
        
        if any(pattern in lowercase_name for pattern in ['component', 'page', '-page', 'frontend']) and any(lowercase_name.endswith(ext) for ext in ['.ts', '.tsx', '.js', '.jsx']):
            # Determine the appropriate destination
            if 'component' in lowercase_name:
                # Convert kebab-case to PascalCase for component files
                component_name = ''.join(word.capitalize() for word in re.sub(r'[-_]component.*', '', lowercase_name).split('-')) + '.tsx'
                destination = os.path.join(frontend_dirs['components'], component_name)
            elif 'page' in lowercase_name:
                page_name = ''.join(word.capitalize() for word in re.sub(r'[-_]page.*', '', lowercase_name).split('-')) + '.tsx'
                destination = os.path.join(frontend_dirs['pages'], page_name)
            else:
                destination = os.path.join(frontend_dirs['src'], filename)
                
            # Copy the file (don't move from root yet)
            if not os.path.exists(destination):
                shutil.copy2(file_path, destination)
                print(f"Copied: {file_path} -> {destination}")
    
    # Remove frontend-new directory
    if os.path.exists(frontend_new_dir):
        response = input(f"Do you want to remove the {frontend_new_dir} directory? (y/n): ")
        if response.lower() == 'y':
            try:
                shutil.rmtree(frontend_new_dir)
                print(f"Removed directory: {frontend_new_dir}")
            except Exception as e:
                print(f"Error removing {frontend_new_dir}: {e}")
    
    print("\nFrontend organization complete!")
    print("All frontend files have been consolidated into the 'frontend' directory.")
    print("You can now run the project with a single frontend folder.")

if __name__ == "__main__":
    main()