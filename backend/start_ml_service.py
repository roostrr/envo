#!/usr/bin/env python3
"""
Startup script for ML service with error handling
This script provides better error reporting and graceful handling of import issues
"""

import os
import sys
import traceback
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_dependencies():
    """Check if all required dependencies are available"""
    logger.info("Checking dependencies...")
    
    try:
        import flask
        logger.info(f"✅ Flask {flask.__version__} available")
    except ImportError as e:
        logger.error(f"❌ Flask not available: {e}")
        return False
    
    try:
        import flask_cors
        logger.info("✅ Flask-CORS available")
    except ImportError as e:
        logger.error(f"❌ Flask-CORS not available: {e}")
        return False
    
    try:
        import pandas
        logger.info(f"✅ Pandas {pandas.__version__} available")
    except ImportError as e:
        logger.error(f"❌ Pandas not available: {e}")
        return False
    
    try:
        import numpy
        logger.info(f"✅ NumPy {numpy.__version__} available")
    except ImportError as e:
        logger.error(f"❌ NumPy not available: {e}")
        return False
    
    try:
        import sklearn
        logger.info(f"✅ Scikit-learn {sklearn.__version__} available")
    except ImportError as e:
        logger.error(f"❌ Scikit-learn not available: {e}")
        return False
    
    try:
        import joblib
        logger.info(f"✅ Joblib {joblib.__version__} available")
    except ImportError as e:
        logger.error(f"❌ Joblib not available: {e}")
        return False
    
    return True

def check_imports():
    """Check if all required modules can be imported"""
    logger.info("Checking module imports...")
    
    try:
        from standardized_data_collection import standardized_data_collection
        logger.info("✅ standardized_data_collection imported")
    except Exception as e:
        logger.error(f"❌ standardized_data_collection import failed: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False
    
    try:
        from ml_recruitment_service import recruitment_service
        logger.info("✅ ml_recruitment_service imported")
    except Exception as e:
        logger.error(f"❌ ml_recruitment_service import failed: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False
    
    try:
        from sunway_programs_service import sunway_programs_service
        logger.info("✅ sunway_programs_service imported")
    except Exception as e:
        logger.error(f"❌ sunway_programs_service import failed: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False
    
    return True

def create_minimal_app():
    """Create a minimal Flask app if imports fail"""
    from flask import Flask, jsonify
    from flask_cors import CORS
    from datetime import datetime
    
    app = Flask(__name__)
    CORS(app)
    
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'OK',
            'message': 'ML service is running (minimal mode)',
            'timestamp': datetime.now().isoformat(),
            'note': 'Some ML features may not be available'
        }), 200
    
    @app.route('/api/standardized/form-template', methods=['GET'])
    def get_form_template():
        return jsonify({
            'success': False,
            'message': 'ML service is in minimal mode - form template not available'
        }), 503
    
    return app

def main():
    """Main startup function"""
    logger.info("Starting ML service...")
    
    # Check dependencies
    if not check_dependencies():
        logger.error("❌ Dependency check failed")
        sys.exit(1)
    
    # Check imports
    if not check_imports():
        logger.warning("⚠️ Some imports failed, starting in minimal mode")
        app = create_minimal_app()
    else:
        logger.info("✅ All imports successful, starting full service")
        try:
            from standardized_app import app
        except Exception as e:
            logger.error(f"❌ Failed to import app: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            app = create_minimal_app()
    
    # Get port from environment
    port = int(os.environ.get('PORT', 5004))
    logger.info(f"Starting server on port {port}")
    
    try:
        app.run(host='0.0.0.0', port=port, debug=False)
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        sys.exit(1)

if __name__ == '__main__':
    main()
