from flask import Blueprint, request, jsonify
from standardized_data_collection import standardized_data_collection
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
standardized_bp = Blueprint('standardized', __name__)

@standardized_bp.route('/form-template', methods=['GET'])
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

@standardized_bp.route('/collect-data', methods=['POST'])
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
        student_id = data.get('student_id', str(uuid.uuid4()))
        form_data = data.get('form_data', {})
        
        # Collect data and generate predictions
        result = standardized_data_collection.collect_student_data(student_id, form_data)
        
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
        return jsonify({
            'success': False,
            'message': f"Error processing request: {str(e)}"
        }), 500

@standardized_bp.route('/student/<student_id>/profile', methods=['GET'])
def get_student_profile(student_id):
    """Get student profile and prediction results"""
    try:
        from ml_recruitment_service import recruitment_service
        
        student_data = recruitment_service.students.get(student_id, {}).get('data', {})
        
        if not student_data:
            return jsonify({
                'success': False,
                'message': 'Student profile not found'
            }), 404
        
        # Generate prediction if not already done
        if 'college_scorecard_ADM_RATE' in student_data:
            prediction = standardized_data_collection._generate_prediction(student_data)
            recommendations = standardized_data_collection._generate_recommendations(prediction, student_data)
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

@standardized_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Standardized data collection service is running',
        'status': 'healthy'
    }) 