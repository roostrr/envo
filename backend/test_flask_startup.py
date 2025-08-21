#!/usr/bin/env python3
"""
Test script to verify Flask app startup
"""

import os
import sys
import traceback

def test_imports():
    """Test if all required modules can be imported"""
    print("Testing imports...")
    
    try:
        from flask import Flask
        print("✅ Flask imported successfully")
    except Exception as e:
        print(f"❌ Flask import failed: {e}")
        return False
    
    try:
        from flask_cors import CORS
        print("✅ Flask-CORS imported successfully")
    except Exception as e:
        print(f"❌ Flask-CORS import failed: {e}")
        return False
    
    try:
        from standardized_data_collection import standardized_data_collection
        print("✅ standardized_data_collection imported successfully")
    except Exception as e:
        print(f"❌ standardized_data_collection import failed: {e}")
        return False
    
    try:
        from ml_recruitment_service import recruitment_service
        print("✅ ml_recruitment_service imported successfully")
    except Exception as e:
        print(f"❌ ml_recruitment_service import failed: {e}")
        return False
    
    try:
        from sunway_programs_service import sunway_programs_service
        print("✅ sunway_programs_service imported successfully")
    except Exception as e:
        print(f"❌ sunway_programs_service import failed: {e}")
        return False
    
    return True

def test_app_creation():
    """Test if Flask app can be created"""
    print("\nTesting Flask app creation...")
    
    try:
        from standardized_app import app
        print("✅ Flask app created successfully")
        return True
    except Exception as e:
        print(f"❌ Flask app creation failed: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return False

def test_health_endpoint():
    """Test if health endpoint works"""
    print("\nTesting health endpoint...")
    
    try:
        from standardized_app import app
        
        with app.test_client() as client:
            response = client.get('/health')
            if response.status_code == 200:
                print("✅ Health endpoint works")
                print(f"Response: {response.get_json()}")
                return True
            else:
                print(f"❌ Health endpoint returned status {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ Health endpoint test failed: {e}")
        return False

if __name__ == '__main__':
    print("Flask App Startup Test")
    print("=" * 50)
    
    # Test imports
    if not test_imports():
        print("\n❌ Import tests failed")
        sys.exit(1)
    
    # Test app creation
    if not test_app_creation():
        print("\n❌ App creation test failed")
        sys.exit(1)
    
    # Test health endpoint
    if not test_health_endpoint():
        print("\n❌ Health endpoint test failed")
        sys.exit(1)
    
    print("\n✅ All tests passed! Flask app should start successfully.")
