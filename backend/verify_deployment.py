#!/usr/bin/env python3
"""
Deployment verification script for Render
This script checks if all required components are available for deployment
"""

import os
import sys
import json
import traceback

def check_environment():
    """Check if required environment variables are set"""
    print("Checking environment variables...")
    
    required_vars = ['PORT']
    optional_vars = ['FLASK_ENV', 'NODE_ENV']
    
    for var in required_vars:
        if var in os.environ:
            print(f"✅ {var} is set: {os.environ[var]}")
        else:
            print(f"⚠️ {var} is not set (will use default)")
    
    for var in optional_vars:
        if var in os.environ:
            print(f"✅ {var} is set: {os.environ[var]}")
        else:
            print(f"ℹ️ {var} is not set (optional)")
    
    return True

def check_files():
    """Check if required files exist"""
    print("\nChecking required files...")
    
    required_files = [
        'requirements.txt',
        'standardized_app.py',
        'ml_recruitment_service.py',
        'standardized_data_collection.py',
        'sunway_programs_service.py'
    ]
    
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file} exists")
        else:
            print(f"❌ {file} missing")
            return False
    
    return True

def check_directories():
    """Check if required directories exist"""
    print("\nChecking required directories...")
    
    required_dirs = ['data', 'models']
    
    for dir_name in required_dirs:
        if os.path.exists(dir_name):
            print(f"✅ {dir_name}/ directory exists")
        else:
            print(f"⚠️ {dir_name}/ directory missing (will be created)")
    
    return True

def check_models():
    """Check if ML models exist"""
    print("\nChecking ML models...")
    
    model_files = [
        'models/recruitment_model.joblib',
        'models/recruitment_scaler.joblib',
        'models/student_clusters.joblib'
    ]
    
    for model_file in model_files:
        if os.path.exists(model_file):
            size = os.path.getsize(model_file)
            print(f"✅ {model_file} exists ({size} bytes)")
        else:
            print(f"⚠️ {model_file} missing (will be created on first use)")
    
    return True

def check_data():
    """Check if data files exist"""
    print("\nChecking data files...")
    
    data_files = [
        'data/students.json',
        'data/conversations.json'
    ]
    
    for data_file in data_files:
        if os.path.exists(data_file):
            size = os.path.getsize(data_file)
            print(f"✅ {data_file} exists ({size} bytes)")
        else:
            print(f"⚠️ {data_file} missing (will be created on first use)")
    
    return True

def test_health_endpoint():
    """Test the health endpoint"""
    print("\nTesting health endpoint...")
    
    try:
        # Import the app
        from standardized_app import app
        
        # Test the health endpoint
        with app.test_client() as client:
            response = client.get('/health')
            
            if response.status_code == 200:
                data = response.get_json()
                print(f"✅ Health endpoint works: {data}")
                return True
            else:
                print(f"❌ Health endpoint returned status {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Health endpoint test failed: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return False

def main():
    """Main verification function"""
    print("Deployment Verification")
    print("=" * 50)
    
    checks = [
        check_environment,
        check_files,
        check_directories,
        check_models,
        check_data,
        test_health_endpoint
    ]
    
    all_passed = True
    
    for check in checks:
        try:
            if not check():
                all_passed = False
        except Exception as e:
            print(f"❌ Check failed with error: {e}")
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("✅ All deployment checks passed!")
        print("The application should deploy successfully on Render.")
        return 0
    else:
        print("❌ Some deployment checks failed.")
        print("Please fix the issues before deploying.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
