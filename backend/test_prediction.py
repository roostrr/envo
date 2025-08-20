#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ml_recruitment_service import recruitment_service

def test_prediction():
    """Test the prediction method directly"""
    
    # Test data with business interest
    student_data = {
        'original_form_data': {
            'name': 'Test Student',
            'email': 'test@example.com',
            'gpa': 3.8,
            'sat_score': 1400,
            'academic_interests': ['business'],
            'budget_range': '$20,000-$40,000',
            'family_income_level': '$50,000-$100,000',
            'first_generation': False,
            'fulltime_study': True,
            'international_student': False,
            'tuition_budget': '$20,000-$40,000',
            'completion_confidence': 'High',
            'preferred_class_size': 'Medium',
            'financial_aid_eligible': True,
            'prefer_private': False
        },
        'gpa': 3.8,
        'sat_score': 1400,
        'budget_range': '$20,000-$40,000',
        'first_generation': False,
        'family_income': '$50,000-$100,000',
        'academic_interests': ['business']
    }
    
    print("Testing prediction method...")
    print(f"Student data: {student_data}")
    
    try:
        # Test the prediction method directly
        prediction = recruitment_service.predict_recruitment_likelihood(student_data)
        print(f"Prediction result: {prediction}")
        print(f"Cluster: {prediction.get('cluster', 'N/A')}")
    except Exception as e:
        print(f"Error in prediction: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    test_prediction() 