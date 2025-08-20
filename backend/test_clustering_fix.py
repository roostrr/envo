#!/usr/bin/env python3
"""
Test script to verify clustering and admission likelihood fixes
"""

import requests
import json
import time

def test_clustering_and_admission_likelihood():
    """Test the clustering and admission likelihood functionality"""
    
    # Test data for different types of students
    test_students = [
        {
            "student_id": "test_student_1",
            "form_data": {
                "name": "John Smith",
                "email": "john.smith@test.com",
                "gpa": 3.8,
                "sat_score": 1400,
                "family_income_level": "$100,000+",
                "academic_interests": ["engineering", "computer science"],
                "fulltime_study": True,
                "international_student": False,
                "tuition_budget": 60000,
                "completion_confidence": 0.9,
                "preferred_class_size": "medium",
                "financial_aid_eligible": True,
                "prefer_private": True,
                "first_generation": False
            }
        },
        {
            "student_id": "test_student_2", 
            "form_data": {
                "name": "Maria Garcia",
                "email": "maria.garcia@test.com",
                "gpa": 3.2,
                "sat_score": 1150,
                "family_income_level": "$30,000-$50,000",
                "academic_interests": ["business", "finance"],
                "fulltime_study": True,
                "international_student": False,
                "tuition_budget": 25000,
                "completion_confidence": 0.7,
                "preferred_class_size": "large",
                "financial_aid_eligible": True,
                "prefer_private": False,
                "first_generation": True
            }
        },
        {
            "student_id": "test_student_3",
            "form_data": {
                "name": "David Chen",
                "email": "david.chen@test.com", 
                "gpa": 3.5,
                "sat_score": 1250,
                "family_income_level": "$50,000-$100,000",
                "academic_interests": ["arts", "design"],
                "fulltime_study": True,
                "international_student": False,
                "tuition_budget": 35000,
                "completion_confidence": 0.8,
                "preferred_class_size": "small",
                "financial_aid_eligible": True,
                "prefer_private": True,
                "first_generation": False
            }
        },
        {
            "student_id": "test_student_4",
            "form_data": {
                "name": "Sarah Johnson",
                "email": "sarah.johnson@test.com",
                "gpa": 2.8,
                "sat_score": 1050,
                "family_income_level": "$20,000-$30,000", 
                "academic_interests": ["hospitality", "tourism"],
                "fulltime_study": True,
                "international_student": False,
                "tuition_budget": 15000,
                "completion_confidence": 0.6,
                "preferred_class_size": "medium",
                "financial_aid_eligible": True,
                "prefer_private": False,
                "first_generation": True
            }
        },
        {
            "student_id": "test_student_5",
            "form_data": {
                "name": "Michael Brown",
                "email": "michael.brown@test.com",
                "gpa": 3.9,
                "sat_score": 1450,
                "family_income_level": "$100,000+",
                "academic_interests": ["medicine", "pre-med"],
                "fulltime_study": True,
                "international_student": False,
                "tuition_budget": 70000,
                "completion_confidence": 0.95,
                "preferred_class_size": "small",
                "financial_aid_eligible": False,
                "prefer_private": True,
                "first_generation": False
            }
        }
    ]
    
    print("Testing clustering and admission likelihood fixes...")
    print("=" * 60)
    
    results = []
    
    for i, student_data in enumerate(test_students, 1):
        print(f"\nTest Student {i}: {student_data['form_data']['name']}")
        print(f"GPA: {student_data['form_data']['gpa']}, SAT: {student_data['form_data']['sat_score']}")
        print(f"Interests: {student_data['form_data']['academic_interests']}")
        print(f"Budget: ${student_data['form_data']['tuition_budget']:,}")
        
        try:
            # Submit student data
            response = requests.post(
                'http://localhost:5004/api/standardized/collect-data',
                json=student_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                prediction = result.get('prediction', {})
                
                # Extract prediction details
                cluster = prediction.get('cluster', 'unknown')
                probability = prediction.get('primary_probability', prediction.get('probability', 0))
                confidence = prediction.get('confidence', 'Unknown')
                
                print(f"✅ Cluster: {cluster}")
                print(f"✅ Admission Probability: {probability:.3f}")
                print(f"✅ Confidence: {confidence}")
                
                results.append({
                    'student': student_data['form_data']['name'],
                    'cluster': cluster,
                    'probability': probability,
                    'confidence': confidence
                })
                
            else:
                print(f"❌ Error: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    # Analyze results
    print("\n" + "=" * 60)
    print("RESULTS SUMMARY:")
    print("=" * 60)
    
    # Check cluster distribution
    clusters = [r['cluster'] for r in results]
    cluster_counts = {}
    for cluster in clusters:
        cluster_counts[cluster] = cluster_counts.get(cluster, 0) + 1
    
    print(f"Cluster Distribution:")
    for cluster, count in cluster_counts.items():
        print(f"  {cluster}: {count} students")
    
    # Check admission likelihood distribution
    likely_count = sum(1 for r in results if r['probability'] >= 0.6)
    moderate_count = sum(1 for r in results if 0.4 <= r['probability'] < 0.6)
    unlikely_count = sum(1 for r in results if r['probability'] < 0.4)
    
    print(f"\nAdmission Likelihood Distribution:")
    print(f"  Likely (≥0.6): {likely_count} students")
    print(f"  Moderate (0.4-0.6): {moderate_count} students") 
    print(f"  Unlikely (<0.4): {unlikely_count} students")
    
    # Check if fixes are working
    print(f"\nFIX VERIFICATION:")
    print(f"  ✅ Clusters are distributed (not all 'general'): {len(cluster_counts) > 1}")
    print(f"  ✅ Admission likelihood varies (not all 'unlikely'): {unlikely_count < len(results)}")
    
    if len(cluster_counts) > 1 and unlikely_count < len(results):
        print("🎉 SUCCESS: Clustering and admission likelihood fixes are working!")
    else:
        print("❌ ISSUE: Some fixes may not be working properly.")
    
    return results

if __name__ == "__main__":
    test_clustering_and_admission_likelihood() 