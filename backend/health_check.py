#!/usr/bin/env python3
"""
Health check script for deployment verification
"""

import requests
import time
import sys
import os

def check_service(url, service_name, timeout=10):
    """Check if a service is responding"""
    try:
        print(f"Checking {service_name} at {url}...")
        response = requests.get(f"{url}/health", timeout=timeout)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {service_name} is healthy")
            print(f"   Status: {data.get('status', 'Unknown')}")
            print(f"   Message: {data.get('message', 'No message')}")
            return True
        else:
            print(f"❌ {service_name} returned status {response.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ {service_name} timed out")
        return False
    except requests.exceptions.ConnectionError:
        print(f"❌ {service_name} connection failed")
        return False
    except Exception as e:
        print(f"❌ {service_name} error: {e}")
        return False

def main():
    """Main health check function"""
    print("Health Check for University Recruitment Platform")
    print("=" * 50)
    
    # Get service URLs from environment or use defaults
    backend_url = os.environ.get('BACKEND_URL', 'http://localhost:5001')
    ml_service_url = os.environ.get('ML_SERVICE_URL', 'http://localhost:5004')
    
    print(f"Backend URL: {backend_url}")
    print(f"ML Service URL: {ml_service_url}")
    print()
    
    # Check backend service
    backend_healthy = check_service(backend_url, "Backend Service")
    
    # Check ML service
    ml_healthy = check_service(ml_service_url, "ML Service")
    
    print("\n" + "=" * 50)
    if backend_healthy and ml_healthy:
        print("✅ All services are healthy!")
        return 0
    else:
        print("❌ Some services are unhealthy")
        return 1

if __name__ == '__main__':
    sys.exit(main())
