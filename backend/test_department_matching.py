#!/usr/bin/env python3
"""
Test script to verify department-based academic interest matching logic
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from ml_recruitment_service import RecruitmentMLService

def test_department_matching():
    """Test the department-based matching logic"""
    
    # Initialize the ML service
    service = RecruitmentMLService()
    
    # Test cases with different academic interests
    test_cases = [
        {
            'name': 'Engineering Interest - Should find Civil Engineering ONLY',
            'academic_interests': 'Engineering',
            'gpa': 3.5,
            'tuition_budget': '$20,000-$30,000'
        },
        {
            'name': 'Computer Science Interest - Should find IT/Computing programs ONLY',
            'academic_interests': 'Computer Science',
            'gpa': 3.8,
            'tuition_budget': '$30,000-$40,000'
        },
        {
            'name': 'Business Interest - Should find Business programs ONLY',
            'academic_interests': 'Business',
            'gpa': 3.2,
            'tuition_budget': '$20,000-$30,000'
        },
        {
            'name': 'Arts Interest - Should find Arts/Design programs ONLY',
            'academic_interests': 'Arts',
            'gpa': 3.0,
            'tuition_budget': '$20,000-$30,000'
        },
        {
            'name': 'Hospitality Interest - Should find Hotel/Culinary programs ONLY',
            'academic_interests': 'Hospitality',
            'gpa': 3.1,
            'tuition_budget': '$20,000-$30,000'
        },
        {
            'name': 'Medicine Interest - Should find Medical/Nursing programs ONLY',
            'academic_interests': 'Medicine',
            'gpa': 3.7,
            'tuition_budget': '$30,000-$40,000'
        }
    ]
    
    print("Testing Department-Based Academic Interest Matching Logic")
    print("=" * 65)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. {test_case['name']}")
        print(f"   Academic Interest: {test_case['academic_interests']}")
        print(f"   GPA: {test_case['gpa']}")
        print(f"   Budget: {test_case['tuition_budget']}")
        
        # Create student data
        student_data = {
            'original_form_data': {
                'academic_interests': test_case['academic_interests'],
                'gpa': test_case['gpa'],
                'tuition_budget': test_case['tuition_budget']
            }
        }
        
        try:
            # Get recommended programs
            programs = service._generate_recommended_programs(student_data, 'test_cluster')
            
            print(f"   Recommended Programs ({len(programs)}):")
            for j, program in enumerate(programs, 1):
                print(f"     {j}. {program['name']}")
                print(f"        Department: {program['department']}")
                print(f"        Difficulty: {program['difficulty']}")
                print(f"        Fit Score: {program['fit_score']}")
                print(f"        Cost: {program['cost_category']}")
                print()
            
            # Check if programs match the interest and department
            interest = test_case['academic_interests'].lower()
            matching_programs = []
            for program in programs:
                program_name = program['name'].lower()
                department = program['department'].lower()
                
                # Check if it's a good match
                if interest in program_name or interest in department:
                    matching_programs.append({
                        'name': program['name'],
                        'department': program['department'],
                        'match_type': 'direct'
                    })
                elif any(keyword in program_name or keyword in department for keyword in ['engineering', 'technology', 'medical', 'arts', 'hospitality', 'business']):
                    matching_programs.append({
                        'name': program['name'],
                        'department': program['department'],
                        'match_type': 'department'
                    })
            
            if matching_programs:
                print(f"   ✅ Found {len(matching_programs)} relevant programs:")
                for prog in matching_programs:
                    print(f"      - {prog['name']} ({prog['department']}) - {prog['match_type']} match")
            else:
                print(f"   ⚠️  No programs found matching '{interest}'")
            
        except Exception as e:
            print(f"   Error: {e}")
        
        print("-" * 65)

if __name__ == "__main__":
    test_department_matching() 