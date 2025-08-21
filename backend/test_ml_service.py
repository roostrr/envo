#!/usr/bin/env python3
"""
Test script to verify ML service functionality
"""

import requests
import json
import time

def test_ml_service():
    """Test the ML service endpoints"""
    
    base_url = "https://university-recruitment-ml-service.onrender.com"
    
    print("🧪 Testing ML Service...")
    print(f"📍 Base URL: {base_url}")
    print()
    
    # Test 1: Health check
    print("1️⃣ Testing health check...")
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        print()
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print()
    
    # Test 2: Detailed health check
    print("2️⃣ Testing detailed health check...")
    try:
        response = requests.get(f"{base_url}/api/standardized/health", timeout=10)
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Model Status: {data.get('model_status', {})}")
        print(f"   Services: {data.get('services', {})}")
        print()
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print()
    
    # Test 3: Form template
    print("3️⃣ Testing form template...")
    try:
        response = requests.get(f"{base_url}/api/standardized/form-template", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success', False)}")
            print(f"   Template fields: {len(data.get('data', {}).get('fields', []))}")
        else:
            print(f"   Response: {response.text}")
        print()
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print()
    
    # Test 4: Programs endpoint
    print("4️⃣ Testing programs endpoint...")
    try:
        response = requests.get(f"{base_url}/api/standardized/programs", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success', False)}")
            print(f"   Programs count: {len(data.get('data', []))}")
        else:
            print(f"   Response: {response.text}")
        print()
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print()

def test_backend_proxy():
    """Test the backend proxy to ML service"""
    
    base_url = "https://university-recruitment-backend.onrender.com"
    
    print("🔗 Testing Backend Proxy...")
    print(f"📍 Base URL: {base_url}")
    print()
    
    # Test 1: Backend health
    print("1️⃣ Testing backend health...")
    try:
        response = requests.get(f"{base_url}/api/health", timeout=10)
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Services: {data.get('services', {})}")
        print()
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print()
    
    # Test 2: Backend proxy to ML service
    print("2️⃣ Testing backend proxy to ML service...")
    try:
        response = requests.get(f"{base_url}/api/standardized/health", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success', False)}")
            print(f"   Model Status: {data.get('model_status', {})}")
        else:
            print(f"   Response: {response.text}")
        print()
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print()

if __name__ == "__main__":
    print("🚀 Starting ML Service Tests")
    print("=" * 50)
    print()
    
    test_ml_service()
    print("=" * 50)
    print()
    test_backend_proxy()
    
    print("✅ Tests completed!")
