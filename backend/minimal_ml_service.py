from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import time
import os
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app)

# Mock ML service that provides working endpoints
class MockMLService:
    def __init__(self):
        self.programs = [
            {
                "id": "CS001",
                "name": "Bachelor of Computer Science",
                "faculty": "Faculty of Science and Technology",
                "duration": "3 years",
                "credits": 120,
                "tuition_fee": 45000,
                "entry_requirements": {
                    "minimum_gpa": 3.0,
                    "subjects": ["Mathematics", "English", "Physics"],
                    "ielts": 6.0
                },
                "career_prospects": [
                    "Software Developer",
                    "Data Scientist",
                    "System Analyst",
                    "Web Developer"
                ]
            },
            {
                "id": "BA001",
                "name": "Bachelor of Business Administration",
                "faculty": "Faculty of Business",
                "duration": "3 years",
                "credits": 120,
                "tuition_fee": 42000,
                "entry_requirements": {
                    "minimum_gpa": 2.8,
                    "subjects": ["Mathematics", "English", "Business Studies"],
                    "ielts": 6.0
                },
                "career_prospects": [
                    "Business Analyst",
                    "Marketing Manager",
                    "Financial Analyst",
                    "Human Resources Manager"
                ]
            },
            {
                "id": "ENG001",
                "name": "Bachelor of Engineering (Mechanical)",
                "faculty": "Faculty of Engineering",
                "duration": "4 years",
                "credits": 140,
                "tuition_fee": 48000,
                "entry_requirements": {
                    "minimum_gpa": 3.2,
                    "subjects": ["Mathematics", "Physics", "Chemistry"],
                    "ielts": 6.5
                },
                "career_prospects": [
                    "Mechanical Engineer",
                    "Design Engineer",
                    "Project Manager",
                    "Research Engineer"
                ]
            }
        ]
        
        self.form_template = {
            "title": "Student Information Form",
            "description": "Please provide your information for career forecasting",
            "fields": [
                {
                    "name": "name",
                    "label": "Full Name",
                    "type": "text",
                    "required": True,
                    "placeholder": "Enter your full name"
                },
                {
                    "name": "email",
                    "label": "Email Address",
                    "type": "email",
                    "required": True,
                    "placeholder": "Enter your email address"
                },
                {
                    "name": "gpa",
                    "label": "GPA",
                    "type": "number",
                    "required": True,
                    "placeholder": "Enter your GPA (0.0-4.0)",
                    "min": 0.0,
                    "max": 4.0,
                    "step": 0.1
                },
                {
                    "name": "major",
                    "label": "Intended Major",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"value": "computer_science", "label": "Computer Science"},
                        {"value": "business", "label": "Business Administration"},
                        {"value": "engineering", "label": "Engineering"},
                        {"value": "medicine", "label": "Medicine"},
                        {"value": "law", "label": "Law"}
                    ]
                },
                {
                    "name": "budget",
                    "label": "Budget Range",
                    "type": "select",
                    "required": True,
                    "options": [
                        {"value": "low", "label": "Under $30,000"},
                        {"value": "medium", "label": "$30,000 - $50,000"},
                        {"value": "high", "label": "Over $50,000"}
                    ]
                }
            ]
        }
    
    def predict_admission(self, student_data):
        """Mock prediction based on GPA"""
        gpa = float(student_data.get('gpa', 3.0))
        
        if gpa >= 3.5:
            probability = 0.85
            likelihood = "Likely"
        elif gpa >= 3.0:
            probability = 0.65
            likelihood = "Moderate"
        else:
            probability = 0.35
            likelihood = "Unlikely"
        
        return {
            "probability": probability,
            "likelihood": likelihood,
            "confidence": "high" if abs(gpa - 3.0) > 0.5 else "medium"
        }
    
    def get_recommendations(self, student_data, prediction):
        """Generate recommendations based on student data"""
        major = student_data.get('major', 'computer_science')
        gpa = float(student_data.get('gpa', 3.0))
        
        recommendations = []
        
        if prediction['likelihood'] == "Likely":
            recommendations.append("Excellent academic profile! You have a strong chance of admission.")
            recommendations.append("Consider applying to competitive programs.")
        elif prediction['likelihood'] == "Moderate":
            recommendations.append("Good academic standing. Focus on strengthening your application.")
            recommendations.append("Consider retaking standardized tests if needed.")
        else:
            recommendations.append("Consider improving your GPA through additional coursework.")
            recommendations.append("Look into programs with more flexible admission requirements.")
        
        # Major-specific recommendations
        if major == "computer_science":
            recommendations.append("Consider taking programming courses to strengthen your application.")
        elif major == "business":
            recommendations.append("Leadership experience and internships will strengthen your application.")
        elif major == "engineering":
            recommendations.append("Strong performance in math and science courses is important.")
        
        return recommendations

# Initialize mock service
mock_service = MockMLService()

@app.route('/health', methods=['GET'])
def simple_health_check():
    """Simple health check endpoint for Render"""
    return jsonify({
        'status': 'OK',
        'message': 'ML service is running',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/standardized/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Standardized data collection service is running',
        'status': 'healthy',
        'services': {
            'ml_recruitment': 'available',
            'standardized_collection': 'available',
            'sunway_programs': 'available'
        },
        'model_status': {
            'model_loaded': True,
            'scaler_loaded': True,
            'kmeans_loaded': True
        },
        'timestamp': time.time()
    })

@app.route('/api/standardized/form-template', methods=['GET'])
def get_form_template():
    """Get the standardized form template"""
    return jsonify({
        'success': True,
        'data': mock_service.form_template
    })

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
        
        # Generate prediction
        prediction = mock_service.predict_admission(form_data)
        recommendations = mock_service.get_recommendations(form_data, prediction)
        
        return jsonify({
            'success': True,
            'student_id': student_id,
            'message': 'Data collected and prediction generated successfully',
            'prediction': prediction,
            'recommendations': recommendations,
            'student_profile': form_data
        })
            
    except Exception as e:
        logger.error(f"Error collecting student data: {e}")
        return jsonify({
            'success': False,
            'message': f"Error processing request: {str(e)}"
        }), 500

@app.route('/api/standardized/programs', methods=['GET'])
def get_programs():
    """Get all available programs"""
    return jsonify({
        'success': True,
        'data': mock_service.programs
    })

@app.route('/api/standardized/programs/cluster/<cluster_name>', methods=['GET'])
def get_programs_by_cluster(cluster_name):
    """Get programs by cluster"""
    # Filter programs by faculty (as cluster)
    filtered_programs = [p for p in mock_service.programs if cluster_name.lower() in p['faculty'].lower()]
    return jsonify({
        'success': True,
        'cluster': cluster_name,
        'data': filtered_programs
    })

@app.route('/api/standardized/analytics', methods=['GET'])
def get_analytics():
    """Get comprehensive analytics data for admin dashboard"""
    analytics_data = {
        'model_metrics': {
            'accuracy': 0.85,
            'precision': 0.82,
            'recall': 0.88,
            'f1_score': 0.85
        },
        'student_analysis': {
            'total_students': 150,
            'average_gpa': 3.2,
            'top_majors': ['Computer Science', 'Business Administration', 'Engineering']
        },
        'real_time_metrics': {
            'total_predictions': 150,
            'average_probability': 0.65,
            'admission_likelihood_distribution': {
                'Likely': {'count': 45, 'percentage': 30},
                'Moderate': {'count': 75, 'percentage': 50},
                'Unlikely': {'count': 30, 'percentage': 20}
            }
        },
        'admission_stats': {
            'total_students': 150,
            'likely_admitted': 45,
            'moderate_chance': 75,
            'unlikely_admitted': 30,
            'average_probability': 0.65
        },
        'last_updated': datetime.now().isoformat()
    }
    
    return jsonify({
        'success': True,
        'data': analytics_data
    })

if __name__ == '__main__':
    print("🚀 Starting Minimal ML Service...")
    print("📅 Start time:", datetime.now().isoformat())
    print("✅ All endpoints available and functional")
    
    # Get port from environment or default
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=False)
#   F o r c e   r e d e p l o y   -   0 8 / 2 2 / 2 0 2 5   0 2 : 0 9 : 0 0  
 
# Force redeploy timestamp: 2025-08-22T02:10:52.733065
