#!/usr/bin/env python3
"""
Robust startup script for ML service with error handling
"""

import os
import sys
import logging
import traceback
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_python_dependencies():
    """Check if all required Python packages are available"""
    try:
        import flask
        import flask_cors
        import requests
        import scikit_learn
        import pandas
        import numpy
        import joblib
        import python_dotenv
        import gunicorn
        logger.info("✅ All Python dependencies are available")
        return True
    except ImportError as e:
        logger.error(f"❌ Missing Python dependency: {e}")
        return False

def check_module_imports():
    """Check if all required modules can be imported"""
    try:
        from standardized_data_collection import standardized_data_collection
        from ml_recruitment_service import recruitment_service
        from sunway_programs_service import sunway_programs_service
        logger.info("✅ All modules imported successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Module import error: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

def check_data_files():
    """Check if required data files exist"""
    try:
        import os
        
        # Check sunway_programs.json
        sunway_paths = [
            'data/sunway_programs.json',
            '../data/sunway_programs.json',
            '../../data/sunway_programs.json'
        ]
        
        sunway_found = False
        for path in sunway_paths:
            if os.path.exists(path):
                logger.info(f"✅ Found sunway_programs.json at: {path}")
                sunway_found = True
                break
        
        if not sunway_found:
            logger.warning("⚠️ sunway_programs.json not found in expected locations")
        
        # Check college scorecard data
        csv_paths = [
            'data/college_scorecard/sample_data.csv',
            '../data/college_scorecard/sample_data.csv',
            '../../data/college_scorecard/sample_data.csv'
        ]
        
        csv_found = False
        for path in csv_paths:
            if os.path.exists(path):
                logger.info(f"✅ Found college scorecard data at: {path}")
                csv_found = True
                break
        
        if not csv_found:
            logger.warning("⚠️ College scorecard CSV files not found")
        
        return True
    except Exception as e:
        logger.error(f"❌ Error checking data files: {e}")
        return False

def start_flask_app():
    """Start the Flask app with error handling"""
    try:
        from standardized_app import app
        
        # Get port from environment or default
        port = int(os.environ.get('PORT', 10000))
        
        logger.info(f"🚀 Starting Flask app on port {port}")
        logger.info(f"📅 Start time: {datetime.now().isoformat()}")
        
        # Start the app
        app.run(host='0.0.0.0', port=port, debug=False)
        
    except Exception as e:
        logger.error(f"❌ Failed to start Flask app: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False
    
    return True

def main():
    """Main startup function"""
    logger.info("🔧 Starting ML Service...")
    logger.info(f"📅 Startup time: {datetime.now().isoformat()}")
    
    # Step 1: Check Python dependencies
    if not check_python_dependencies():
        logger.error("❌ Python dependencies check failed")
        sys.exit(1)
    
    # Step 2: Check module imports
    if not check_module_imports():
        logger.error("❌ Module imports check failed")
        sys.exit(1)
    
    # Step 3: Check data files
    if not check_data_files():
        logger.warning("⚠️ Data files check had issues, but continuing...")
    
    # Step 4: Start Flask app
    logger.info("🎯 All checks passed, starting Flask app...")
    if not start_flask_app():
        logger.error("❌ Failed to start Flask app")
        sys.exit(1)

if __name__ == "__main__":
    main()
