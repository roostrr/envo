from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import time
from datetime import datetime
from standardized_data_collection import standardized_data_collection
from ml_recruitment_service import recruitment_service
from sunway_programs_service import sunway_programs_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app)

# Ensure ML model is loaded when app starts
def ensure_model_loaded():
    """Ensure the ML model is loaded when the Flask app starts"""
    try:
        logger.info("Ensuring ML model is loaded...")
        if not recruitment_service.model or not recruitment_service.scaler:
            logger.info("Loading ML model...")
            recruitment_service.load_model()
            logger.info("ML model loaded successfully")
        else:
            logger.info("ML model already loaded")
    except Exception as e:
        logger.error(f"Error loading ML model: {e}")

# Load model on app startup
ensure_model_loaded()

@app.route('/api/standardized/form-template', methods=['GET'])
def get_form_template():
    """Get the standardized form template"""
    try:
        template = standardized_data_collection.get_form_template()
        return jsonify({
            'success': True,
            'data': template
        })
    except Exception as e:
        logger.error(f"Error getting form template: {e}")
        return jsonify({
            'success': False,
            'message': f"Error getting form template: {str(e)}"
        }), 500

@app.route('/api/standardized/collect-data', methods=['POST'])
def collect_student_data():
    """Collect standardized student data and generate predictions"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Generate unique student ID if not provided
        student_id = data.get('student_id', f"student_{int(time.time() * 1000)}")
        form_data = data.get('form_data', {})
        
        logger.info(f"Processing form data for student {student_id}")
        logger.info(f"Form data: {form_data}")
        
        # Ensure model is loaded before making predictions
        ensure_model_loaded()
        
        # Collect data and generate predictions
        result = standardized_data_collection.collect_student_data(student_id, form_data)
        
        logger.info(f"Result: {result}")
        
        if result['success']:
            return jsonify({
                'success': True,
                'student_id': student_id,
                'message': result['message'],
                'prediction': result['prediction'],
                'recommendations': result['recommendations'],
                'student_profile': result.get('student_profile', {})
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400
            
    except Exception as e:
        logger.error(f"Error collecting student data: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': f"Error processing request: {str(e)}"
        }), 500

@app.route('/api/standardized/student/<student_id>/profile', methods=['GET'])
def get_student_profile(student_id):
    """Get student profile and prediction results"""
    try:
        student_data = recruitment_service.students.get(student_id, {}).get('data', {})
        
        if not student_data:
            return jsonify({
                'success': False,
                'message': 'Student profile not found'
            }), 404
        
        # Generate prediction if not already done
        if 'college_scorecard_ADM_RATE' in student_data:
            prediction = standardized_data_collection._generate_prediction(student_data)
            recommendations = standardized_data_collection._generate_recommendations(student_data, prediction)
        else:
            prediction = None
            recommendations = []
        
        return jsonify({
            'success': True,
            'student_id': student_id,
            'student_profile': student_data,
            'prediction': prediction,
            'recommendations': recommendations
        })
        
    except Exception as e:
        logger.error(f"Error getting student profile: {e}")
        return jsonify({
            'success': False,
            'message': f"Error retrieving profile: {str(e)}"
        }), 500

@app.route('/api/standardized/programs', methods=['GET'])
def get_programs():
    """Get all available programs"""
    try:
        programs = sunway_programs_service.programs
        return jsonify({
            'success': True,
            'data': programs
        })
    except Exception as e:
        logger.error(f"Error getting programs: {e}")
        return jsonify({
            'success': False,
            'message': f"Error retrieving programs: {str(e)}"
        }), 500

@app.route('/api/standardized/programs/cluster/<cluster_name>', methods=['GET'])
def get_programs_by_cluster(cluster_name):
    """Get programs by cluster"""
    try:
        programs = sunway_programs_service.get_programs_by_cluster(cluster_name)
        return jsonify({
            'success': True,
            'cluster': cluster_name,
            'data': programs
        })
    except Exception as e:
        logger.error(f"Error getting programs by cluster: {e}")
        return jsonify({
            'success': False,
            'message': f"Error retrieving programs: {str(e)}"
        }), 500

@app.route('/api/standardized/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check if all services are available
        services_status = {
            'ml_recruitment': 'available' if recruitment_service else 'unavailable',
            'standardized_collection': 'available' if standardized_data_collection else 'unavailable',
            'sunway_programs': 'available' if sunway_programs_service else 'unavailable'
        }
        
        # Check model status
        model_status = {
            'model_loaded': recruitment_service.model is not None,
            'scaler_loaded': recruitment_service.scaler is not None,
            'kmeans_loaded': recruitment_service.kmeans is not None
        }
        
        return jsonify({
            'success': True,
            'message': 'Standardized data collection service is running',
            'status': 'healthy',
            'services': services_status,
            'model_status': model_status,
            'timestamp': time.time()
        })
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            'success': False,
            'message': f'Health check failed: {str(e)}'
        }), 500

@app.route('/api/standardized/load-model', methods=['POST'])
def load_model():
    """Manually trigger model loading"""
    try:
        ensure_model_loaded()
        return jsonify({
            'success': True,
            'message': 'Model loaded successfully',
            'model_loaded': recruitment_service.model is not None,
            'scaler_loaded': recruitment_service.scaler is not None
        })
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return jsonify({
            'success': False,
            'message': f'Error loading model: {str(e)}'
        }), 500

@app.route('/api/standardized/model-info', methods=['GET'])
def get_model_info():
    """Get information about the ML model"""
    try:
        metrics = recruitment_service.get_model_metrics()
        return jsonify({
            'success': True,
            'data': metrics
        })
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        return jsonify({
            'success': False,
            'message': f"Error retrieving model info: {str(e)}"
        }), 500

@app.route('/api/standardized/students', methods=['GET'])
def get_students():
    """Get all students with their predictions"""
    try:
        students_data = []
        for student_id, student_info in recruitment_service.students.items():
            student_data = student_info.get('data', {})
            
            # Generate prediction if not already done
            if student_data and 'college_scorecard_ADM_RATE' in student_data:
                prediction = standardized_data_collection._generate_prediction(student_data)
            else:
                prediction = None
            
            students_data.append({
                'id': student_id,
                'data': student_data,
                'prediction': prediction,
                'created_at': student_info.get('created_at', ''),
                'last_interaction': student_info.get('last_updated', '')
            })
        
        return jsonify({
            'success': True,
            'data': students_data
        })
    except Exception as e:
        logger.error(f"Error getting students: {e}")
        return jsonify({
            'success': False,
            'message': f"Error getting students: {str(e)}"
        }), 500

@app.route('/api/standardized/conversations', methods=['GET'])
def get_conversations():
    """Get all conversations and analytics data"""
    try:
        conversations_data = recruitment_service.get_conversations_data()
        
        return jsonify({
            'success': True,
            'data': conversations_data
        })
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        return jsonify({
            'success': False,
            'message': f"Error getting conversations: {str(e)}"
        }), 500

@app.route('/api/standardized/analytics', methods=['GET'])
def get_analytics():
    """Get comprehensive analytics data for admin dashboard"""
    try:
        # Get model metrics
        model_metrics = recruitment_service.get_model_metrics()
        
        # Get student analysis data
        student_analysis = recruitment_service.get_student_analysis_data()
        
        # Get real-time metrics
        real_time_metrics = recruitment_service._get_real_time_metrics()
        
        # Calculate admission stats from real-time metrics
        admission_stats = {
            'total_students': student_analysis.get('total_students', 0),
            'likely_admitted': real_time_metrics.get('admission_likelihood_distribution', {}).get('Likely', {}).get('count', 0),
            'moderate_chance': real_time_metrics.get('admission_likelihood_distribution', {}).get('Moderate', {}).get('count', 0),
            'unlikely_admitted': real_time_metrics.get('admission_likelihood_distribution', {}).get('Unlikely', {}).get('count', 0),
            'average_probability': real_time_metrics.get('average_probability', 0)
        }
        
        analytics_data = {
            'model_metrics': model_metrics,
            'student_analysis': student_analysis,
            'real_time_metrics': real_time_metrics,
            'admission_stats': admission_stats,
            'last_updated': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': analytics_data
        })
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        return jsonify({
            'success': False,
            'message': f"Error getting analytics: {str(e)}"
        }), 500

@app.route('/api/standardized/retrain', methods=['POST'])
def retrain_model():
    """Retrain the ML model with current data"""
    try:
        result = recruitment_service.retrain_model_with_conversations()
        
        return jsonify({
            'success': result.get('success', False),
            'message': result.get('message', 'Unknown error'),
            'metrics': result.get('metrics', {})
        })
    except Exception as e:
        logger.error(f"Error retraining model: {e}")
        return jsonify({
            'success': False,
            'message': f"Error retraining model: {str(e)}"
        }), 500

if __name__ == '__main__':
    print("Starting Standardized Data Collection Service...")
    print("Available endpoints:")
    print("  GET  /api/standardized/form-template")
    print("  POST /api/standardized/collect-data")
    print("  GET  /api/standardized/student/<id>/profile")
    print("  GET  /api/standardized/programs")
    print("  GET  /api/standardized/programs/cluster/<name>")
    print("  GET  /api/standardized/metrics")
    print("  GET  /api/standardized/analytics")
    print()
    
    # Ensure ML model is loaded
    print("Ensuring ML model is loaded...")
    try:
        print("Loading ML model...")
        recruitment_service.load_model()
        print("ML model loaded successfully")
    except Exception as e:
        print(f"Error loading ML model: {e}")
    
    # Run on port 5004 to match the Node.js backend configuration
    app.run(host='0.0.0.0', port=5004, debug=True) 