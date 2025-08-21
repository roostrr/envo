#!/usr/bin/env python3
"""
Force redeploy script to ensure services are updated
"""

import os
import subprocess
import time
from datetime import datetime

def force_redeploy():
    """Force redeploy by making changes and pushing"""
    
    print("🔄 Forcing redeploy...")
    
    # Step 1: Add timestamp to force changes
    timestamp = datetime.now().isoformat()
    
    # Update minimal_ml_service.py
    with open('backend/minimal_ml_service.py', 'a') as f:
        f.write(f"\n# Force redeploy timestamp: {timestamp}\n")
    
    # Update render.yaml
    with open('render.yaml', 'a') as f:
        f.write(f"\n# Force redeploy timestamp: {timestamp}\n")
    
    print("✅ Added timestamp to force changes")
    
    # Step 2: Git commands
    try:
        print("📝 Adding files...")
        subprocess.run(['git', 'add', '.'], check=True)
        
        print("💾 Committing changes...")
        subprocess.run(['git', 'commit', '-m', f'Force redeploy - {timestamp}'], check=True)
        
        print("🚀 Pushing to trigger deployment...")
        subprocess.run(['git', 'push'], check=True)
        
        print("✅ Force redeploy completed!")
        print("⏳ Wait 2-5 minutes for deployment to complete")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during git operations: {e}")
        return False
    
    return True

if __name__ == "__main__":
    force_redeploy()
