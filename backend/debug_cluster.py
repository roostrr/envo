#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ml_recruitment_service import recruitment_service

def test_cluster_assignment():
    """Test the cluster assignment logic directly"""
    
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
    
    # Test features
    features = [0.3, 0.2, 0.8, 25000, 25000, 30000, 15000, 25000, 5000, 1, 2]
    
    print("Testing cluster assignment...")
    print(f"Student data: {student_data}")
    
    # Test the _determine_cluster method directly
    cluster = recruitment_service._determine_cluster(student_data, features)
    print(f"Assigned cluster: {cluster}")
    
    # Test with engineering interest
    student_data['original_form_data']['academic_interests'] = ['engineering']
    student_data['academic_interests'] = ['engineering']
    
    cluster = recruitment_service._determine_cluster(student_data, features)
    print(f"Assigned cluster for engineering: {cluster}")
    
    # Test with arts interest
    student_data['original_form_data']['academic_interests'] = ['arts']
    student_data['academic_interests'] = ['arts']
    
    cluster = recruitment_service._determine_cluster(student_data, features)
    print(f"Assigned cluster for arts: {cluster}")

if __name__ == "__main__":
    test_cluster_assignment() 