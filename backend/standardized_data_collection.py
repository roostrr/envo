import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging
from ml_recruitment_service import recruitment_service
from sunway_programs_service import sunway_programs_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StandardizedDataCollection:
    def __init__(self):
        self.required_fields = [
            'gpa', 'family_income_level', 'academic_interests', 
            'fulltime_study', 'international_student', 'tuition_budget',
            'completion_confidence', 'preferred_class_size', 
            'financial_aid_eligible', 'prefer_private'
        ]
        
        self.field_mappings = {
            'gpa': 'ADM_RATE',
            'family_income_level': 'PCTPELL', 
            'completion_confidence': 'C150_4',
            'fulltime_study': 'RET_FT4',
            'tuition_budget': 'TUITIONFEE_IN',
            'international_student': 'TUITIONFEE_OUT',
            'total_budget': 'COSTT4_A',
            'financial_aid_eligible': 'NPT4_PUB',
            'prefer_private': 'NPT4_PRIV',
            'preferred_class_size': 'UGDS'
        }
        
        self.default_values = {
            'CONTROL': 1,  # Public institution
            'LOCALE': 2    # Suburban
        }
    
    def convert_gpa_to_sat_equivalent(self, gpa: float, family_income_level: str = 'medium', first_generation: bool = False) -> int:
        """
        Convert GPA to estimated SAT equivalent score using non-sensitive contextual data
        """
        try:
            # Base SAT score based on GPA (primary factor)
            if gpa >= 3.8:
                base_sat = 1400
            elif gpa >= 3.5:
                base_sat = 1300
            elif gpa >= 3.0:
                base_sat = 1200
            elif gpa >= 2.5:
                base_sat = 1100
            else:
                base_sat = 1000
            
            # Minor adjustments based on available context (non-sensitive)
            adjustment = 0
            
            # First-generation students often perform better than expected
            if first_generation:
                adjustment += 50
            
            # Low-income students may have overcome additional challenges
            family_income_str = str(family_income_level).lower()
            if family_income_str in ['low', 'under $30,000']:
                adjustment += 25
            
            # Add small random variation for realism (±50 points)
            import random
            random_adjustment = random.uniform(-50, 50)
            
            # Calculate final SAT score
            final_sat = base_sat + adjustment + random_adjustment
            
            # Keep within valid SAT range (400-1600)
            return max(400, min(1600, int(final_sat)))
            
        except Exception as e:
            logger.warning(f"Error converting GPA to SAT equivalent: {e}")
            # Fallback to conservative estimate
            return 1200
    
    def collect_student_data(self, student_id: str, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Collect standardized student data from form inputs
        Returns: {'success': bool, 'message': str, 'prediction': dict, 'recommendations': list}
        """
        try:
            # Validate required fields
            missing_fields = self._validate_required_fields(form_data)
            if missing_fields:
                return {
                    'success': False,
                    'message': f"Missing required fields: {', '.join(missing_fields)}",
                    'prediction': None,
                    'recommendations': []
                }
            
            # Process and standardize the data
            student_profile = self._process_form_data(form_data)
            
            # Save student data
            recruitment_service.add_student({
                'id': student_id,
                'data': student_profile
            })
            
            # Generate ML prediction
            prediction = self._generate_prediction(student_profile)
            
            # Generate program recommendations
            if prediction is None:
                # Create a default prediction if ML prediction fails
                prediction = {
                    'primary_prediction': 0,
                    'primary_probability': 0.5,
                    'confidence': 'Medium',
                    'cluster': 'mid_size_private_religious',
                    'cluster_id': 0,
                    'predictions': {},
                    'probabilities': {}
                }
            
            recommendations = self._generate_recommendations(student_profile, prediction)
            
            return {
                'success': True,
                'message': 'Data collected successfully. Here are your personalized recommendations.',
                'prediction': prediction,
                'recommendations': recommendations,
                'student_profile': student_profile
            }
            
        except Exception as e:
            logger.error(f"Error collecting student data: {e}")
            return {
                'success': False,
                'message': f"Error processing data: {str(e)}",
                'prediction': None,
                'recommendations': []
            }
    
    def _validate_required_fields(self, form_data: Dict[str, Any]) -> List[str]:
        """Validate that all required fields are present"""
        missing = []
        for field in self.required_fields:
            if field not in form_data or form_data[field] is None or form_data[field] == '':
                missing.append(field)
        return missing
    
    def _process_form_data(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process form data and map to College Scorecard variables"""
        student_profile = {}
        
        # Convert GPA to SAT equivalent score
        gpa = float(form_data.get('gpa', 3.0))
        family_income_level = form_data.get('family_income_level', 'medium')
        first_generation_value = form_data.get('first_generation', False)
        first_generation = str(first_generation_value).lower() == 'yes' if isinstance(first_generation_value, str) else bool(first_generation_value)
        
        # Generate SAT equivalent score
        sat_equivalent = self.convert_gpa_to_sat_equivalent(gpa, family_income_level, first_generation)
        
        # Add converted SAT score to form data for ML processing
        form_data_with_sat = form_data.copy()
        form_data_with_sat['sat_score'] = sat_equivalent
        
        # Map form fields to College Scorecard variables with better defaults
        for field, scorecard_var in self.field_mappings.items():
            if field in form_data:
                value = form_data[field]
                mapped_value = self._map_field_to_scorecard(field, value)
                student_profile[f'college_scorecard_{scorecard_var}'] = mapped_value
            else:
                # Use realistic default values
                default_value = self._get_default_value(scorecard_var)
                student_profile[f'college_scorecard_{scorecard_var}'] = default_value
        
        # Add default values for missing variables
        for var, value in self.default_values.items():
            key = f'college_scorecard_{var}'
            if key not in student_profile:
                student_profile[key] = value
        
        # Add original form data with SAT equivalent for reference
        student_profile['original_form_data'] = form_data_with_sat
        
        return student_profile
    
    def _map_field_to_scorecard(self, field: str, value: Any) -> float:
        """Map form field values to College Scorecard variables"""
        try:
            if field == 'gpa':
                # GPA to admission rate mapping (higher GPA = lower admission rate = more selective)
                gpa = float(value) if value else 3.0
                if gpa >= 3.8:
                    return 0.3  # Very selective
                elif gpa >= 3.5:
                    return 0.5  # Moderately selective
                elif gpa >= 3.0:
                    return 0.7  # Less selective
                else:
                    return 0.8  # Very accessible
            
            elif field == 'family_income_level':
                # Income level to Pell percentage mapping
                income_level = str(value).lower() if value else 'moderate'
                if income_level in ['low', 'very_low']:
                    return 0.6  # High Pell percentage
                elif income_level in ['moderate', 'middle']:
                    return 0.4  # Moderate Pell percentage
                else:
                    return 0.2  # Low Pell percentage
            
            elif field == 'completion_confidence':
                # Confidence to completion rate mapping
                confidence = float(value) if value else 0.7
                return min(max(confidence, 0.3), 0.9)  # Clamp between 0.3 and 0.9
            
            elif field == 'fulltime_study':
                # Full-time study to retention rate mapping
                if isinstance(value, str):
                    is_fulltime = value.lower() in ['true', 'yes', '1']
                else:
                    is_fulltime = bool(value) if value is not None else True
                return 0.8 if is_fulltime else 0.6
            
            elif field == 'tuition_budget':
                # Budget to tuition mapping
                budget = float(value) if value else 25000
                if budget >= 40000:
                    return 35000  # High tuition
                elif budget >= 25000:
                    return 25000  # Moderate tuition
                else:
                    return 15000  # Low tuition
            
            elif field == 'international_student':
                # International status to out-of-state tuition mapping
                if isinstance(value, str):
                    is_international = value.lower() in ['true', 'yes', '1']
                else:
                    is_international = bool(value) if value is not None else False
                return 40000 if is_international else 25000
            
            elif field == 'total_budget':
                # Total budget mapping
                budget = float(value) if value else 30000
                return min(max(budget, 15000), 60000)
            
            elif field == 'financial_aid_eligible':
                # Financial aid to net price mapping
                if isinstance(value, str):
                    eligible = value.lower() in ['true', 'yes', '1']
                else:
                    eligible = bool(value) if value is not None else True
                return 12000 if eligible else 25000
            
            elif field == 'prefer_private':
                # Private preference to private net price mapping
                if isinstance(value, str):
                    prefer_private = value.lower() in ['true', 'yes', '1']
                else:
                    prefer_private = bool(value) if value is not None else False
                return 30000 if prefer_private else 20000
            
            elif field == 'preferred_class_size':
                # Class size to enrollment mapping
                size = str(value).lower() if value else 'medium'
                if size in ['small', 'very_small']:
                    return 2000  # Small enrollment
                elif size in ['large', 'very_large']:
                    return 15000  # Large enrollment
                else:
                    return 5000  # Medium enrollment
            
            else:
                # Default mapping for unknown fields
                if isinstance(value, (int, float)):
                    return float(value)
                elif isinstance(value, bool):
                    return 1.0 if value else 0.0
                else:
                    return 0.5  # Neutral default
                    
        except (ValueError, TypeError) as e:
            logger.warning(f"Error mapping field {field} with value {value}: {e}")
            return self._get_default_value(self.field_mappings.get(field, 'ADM_RATE'))
    
    def _generate_prediction(self, student_profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Generate ML prediction using the recruitment service"""
        try:
            # Extract features for ML prediction
            features = {}
            for field, scorecard_var in self.field_mappings.items():
                key = f'college_scorecard_{scorecard_var}'
                if key in student_profile:
                    features[scorecard_var] = float(student_profile[key])
                else:
                    features[scorecard_var] = self._get_default_value(scorecard_var)
            
            # Add default values for missing variables
            for var, value in self.default_values.items():
                if var not in features:
                    features[var] = value
            
            # Extract academic interests from original form data
            academic_interests = []
            if 'original_form_data' in student_profile:
                original_data = student_profile['original_form_data']
                if isinstance(original_data, dict) and 'academic_interests' in original_data:
                    interests = original_data['academic_interests']
                    if isinstance(interests, list):
                        academic_interests = interests
                    elif isinstance(interests, str):
                        academic_interests = [interests]
            
            # Debug: Check if model is loaded
            if not recruitment_service.model:
                logger.error("ML model is not loaded!")
                return None
            
            if not recruitment_service.scaler:
                logger.error("ML scaler is not loaded!")
                return None
            
            logger.info(f"Making prediction with features: {features}")
            logger.info(f"Academic interests: {academic_interests}")
            
            # Create comprehensive student data structure for prediction
            original_data = student_profile.get('original_form_data', {})
            
            # Helper function to safely convert boolean strings
            def safe_bool(value, default=False):
                if isinstance(value, str):
                    return value.lower() in ['true', 'yes', '1']
                return bool(value) if value is not None else default
            
            student_data = {
                'original_form_data': original_data,
                'gpa': float(original_data.get('gpa', 3.0)),
                'sat_score': int(original_data.get('sat_score', 1200)),
                'budget_range': original_data.get('budget_range', '$20,000-$40,000'),
                'first_generation': safe_bool(original_data.get('first_generation', False)),
                'family_income': original_data.get('family_income_level', '$50,000-$100,000'),
                'academic_interests': academic_interests,
                'fulltime_study': safe_bool(original_data.get('fulltime_study', True)),
                'international_student': safe_bool(original_data.get('international_student', False)),
                'tuition_budget': float(original_data.get('tuition_budget', 25000)),
                'completion_confidence': float(original_data.get('completion_confidence', 0.7)),
                'preferred_class_size': original_data.get('preferred_class_size', 'medium'),
                'financial_aid_eligible': safe_bool(original_data.get('financial_aid_eligible', True)),
                'prefer_private': safe_bool(original_data.get('prefer_private', False))
            }
            
            # Make prediction with student data
            prediction = recruitment_service.predict_recruitment_likelihood(student_data)
            
            logger.info(f"Prediction result: {prediction}")
            
            if prediction:
                # Add interpretation
                prediction['interpretation'] = self._interpret_prediction(prediction)
                prediction['recommendations'] = self._get_prediction_recommendations(prediction)
                
                # Store prediction in student profile for analytics
                student_profile['prediction'] = prediction
                
                # Update the student data in the recruitment service
                recruitment_service.add_student({
                    'id': f"student_{int(datetime.now().timestamp() * 1000)}",
                    'data': student_profile,
                    'prediction': prediction
                })
            
            return prediction
            
        except Exception as e:
            logger.error(f"Error generating prediction: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None
    
    def _get_default_value(self, variable: str) -> float:
        """Get default value for College Scorecard variable"""
        defaults = {
            'ADM_RATE': 0.7,      # Moderate admission rate
            'PCTPELL': 0.3,       # Moderate Pell percentage
            'C150_4': 0.6,        # Moderate completion rate
            'RET_FT4': 0.7,       # Moderate retention rate
            'TUITIONFEE_IN': 25000,  # Moderate in-state tuition
            'TUITIONFEE_OUT': 35000, # Moderate out-of-state tuition
            'COSTT4_A': 30000,       # Moderate total cost
            'NPT4_PUB': 15000,       # Moderate public net price
            'NPT4_PRIV': 25000,      # Moderate private net price
            'UGDS': 5000,            # Moderate enrollment
            'CONTROL': 1,            # Public institution
            'LOCALE': 2              # Suburban
        }
        return defaults.get(variable, 0.0)
    
    def _interpret_prediction(self, prediction: Dict[str, Any]) -> str:
        """Interpret the ML prediction results"""
        probability = prediction.get('probability', 0)
        cluster = prediction.get('cluster', 'general')
        
        if probability >= 0.8:
            return f"Excellent match! You have a {probability*100:.1f}% likelihood of success at Sunway University."
        elif probability >= 0.6:
            return f"Good potential! You have a {probability*100:.1f}% likelihood of success at Sunway University."
        else:
            return f"Every student's journey is unique! We have various support programs to help you succeed at Sunway University."
    
    def _get_prediction_recommendations(self, prediction: Dict[str, Any]) -> List[str]:
        """Get recommendations based on prediction results"""
        probability = prediction.get('probability', 0)
        cluster = prediction.get('cluster', 'general')
        
        recommendations = []
        
        if probability >= 0.8:
            recommendations.append("You're an excellent candidate for Sunway University!")
            recommendations.append("Consider applying for merit-based scholarships.")
            recommendations.append("You may qualify for advanced standing or credit transfer.")
        elif probability >= 0.6:
            recommendations.append("You have strong potential for success at Sunway University.")
            recommendations.append("Consider our academic support programs.")
            recommendations.append("Explore our financial aid options.")
        else:
            recommendations.append("We offer various pathways to success.")
            recommendations.append("Consider our foundation or diploma programs.")
            recommendations.append("Our academic support services can help you thrive.")
        
        # Add cluster-specific recommendations
        cluster_recommendations = {
            'engineering_tech': "Our engineering programs emphasize practical skills and industry connections.",
            'business_finance': "Our business programs offer real-world projects and industry partnerships.",
            'computer_science': "Our computing programs feature cutting-edge technology and AI curriculum.",
            'arts_design': "Our creative programs provide state-of-the-art facilities and industry mentorship.",
            'hospitality_tourism': "Our hospitality programs offer international partnerships and hands-on training."
        }
        
        if cluster in cluster_recommendations:
            recommendations.append(cluster_recommendations[cluster])
        
        return recommendations
    
    def _generate_recommendations(self, student_profile, prediction_result):
        """Generate program recommendations based on student profile and prediction"""
        # Get cluster information from prediction
        cluster = prediction_result.get('cluster', 'regional_comprehensive')
        
        try:
            # Get academic interests from the original form data
            academic_interests = []
            if 'original_form_data' in student_profile:
                interests = student_profile['original_form_data'].get('academic_interests', [])
                if isinstance(interests, list):
                    academic_interests = interests
                elif isinstance(interests, str):
                    academic_interests = [interests]
            
            # If no interests in original form data, try the main profile
            if not academic_interests:
                interests = student_profile.get('academic_interests', [])
                if isinstance(interests, list):
                    academic_interests = interests
                elif isinstance(interests, str):
                    academic_interests = [interests]
            
            # Get programs based on ALL academic interests and cluster
            programs_service = sunway_programs_service
            recommended_programs = []
            
            # Collect programs for all interests
            for interest in academic_interests:
                interest_programs = programs_service.get_programs_by_interest(interest, cluster)
                if interest_programs:
                    recommended_programs.extend(interest_programs)
            
            # If no programs found with cluster filtering, try without cluster
            if not recommended_programs:
                for interest in academic_interests:
                    interest_programs = programs_service.get_programs_by_interest(interest)
                    if interest_programs:
                        recommended_programs.extend(interest_programs)
            
            # Remove duplicates while preserving order
            seen_programs = set()
            unique_programs = []
            for program in recommended_programs:
                program_id = program.get('program_id', program.get('name', ''))
                if program_id not in seen_programs:
                    seen_programs.add(program_id)
                    unique_programs.append(program)
            
            recommended_programs = unique_programs
            
            # If still no programs, get some default programs
            if not recommended_programs:
                recommended_programs = programs_service.get_all_programs()[:10]
            
            # Format recommendations
            recommendations = []
            for program in recommended_programs[:8]:  # Limit to 8 recommendations
                try:
                    tuition = program.get('tuition', 0)
                    if isinstance(tuition, str):
                        # Extract numeric value from tuition string
                        import re
                        tuition_match = re.search(r'[\d,]+', tuition)
                        if tuition_match:
                            tuition = int(tuition_match.group().replace(',', ''))
                        else:
                            tuition = 25000  # Default tuition
                    elif not isinstance(tuition, (int, float)):
                        tuition = 25000
                    
                    # Determine which interests this program matches
                    matched_interests = []
                    for interest in academic_interests:
                        if programs_service.program_matches_interest(program, interest):
                            matched_interests.append(interest)
                    
                    recommendation = {
                        'program_id': program.get('program_id', ''),
                        'name': program.get('name', 'Unknown Program'),
                        'level': program.get('degree_level', 'Bachelor'),
                        'department': program.get('department', ''),
                        'duration': program.get('duration', '4 years'),
                        'tuition': tuition,
                        'description': program.get('description', ''),
                        'match_score': 0.85,  # Default match score
                        'cluster': cluster,
                        'interest': ', '.join(matched_interests) if matched_interests else academic_interests[0] if academic_interests else 'general',
                        'matched_interests': matched_interests
                    }
                    recommendations.append(recommendation)
                except Exception as e:
                    print(f"Error formatting program {program}: {e}")
                    continue
            
            return recommendations
            
        except Exception as e:
            print(f"Error generating recommendations: {e}")
            # Return default recommendations
            return [
                {
                    'program_id': 'default_1',
                    'name': 'Bachelor of Business Administration',
                    'level': 'Bachelor\'s Degree',
                    'department': 'School of Business',
                    'duration': '4 years',
                    'tuition': 25000,
                    'description': 'A comprehensive business program',
                    'match_score': 0.8,
                    'cluster': cluster,
                    'interest': 'business'
                }
            ]
    
    def get_form_template(self) -> Dict[str, Any]:
        """Get the standardized form template"""
        return {
            'title': 'Sunway University Student Profile',
            'description': 'Please provide your information to receive personalized program recommendations.',
            'fields': [
                {
                    'name': 'gpa',
                    'label': 'What is your GPA?',
                    'type': 'number',
                    'required': True,
                    'min': 0.0,
                    'max': 4.0,
                    'step': 0.1,
                    'placeholder': 'e.g., 3.5'
                },
                {
                    'name': 'family_income_level',
                    'label': 'What is your family income level?',
                    'type': 'select',
                    'required': True,
                    'options': [
                        {'value': 'low', 'label': 'Low Income'},
                        {'value': 'medium', 'label': 'Medium Income'},
                        {'value': 'high', 'label': 'High Income'}
                    ]
                },
                {
                    'name': 'academic_interests',
                    'label': 'What are your main academic interests?',
                    'type': 'multiselect',
                    'required': True,
                    'options': [
                        {'value': 'business', 'label': 'Business & Management'},
                        {'value': 'engineering', 'label': 'Engineering & Technology'},
                        {'value': 'computing', 'label': 'Computer Science'},
                        {'value': 'arts', 'label': 'Arts & Design'},
                        {'value': 'hospitality', 'label': 'Hospitality & Tourism'},
                        {'value': 'medicine', 'label': 'Medicine & Health Sciences'}
                    ]
                },
                {
                    'name': 'fulltime_study',
                    'label': 'Do you plan to study full-time?',
                    'type': 'select',
                    'required': True,
                    'options': [
                        {'value': 'yes', 'label': 'Yes, full-time'},
                        {'value': 'no', 'label': 'No, part-time'}
                    ]
                },
                {
                    'name': 'international_student',
                    'label': 'Are you an international student?',
                    'type': 'select',
                    'required': True,
                    'options': [
                        {'value': 'no', 'label': 'No, I am a local student'},
                        {'value': 'yes', 'label': 'Yes, I am an international student'}
                    ]
                },
                {
                    'name': 'tuition_budget',
                    'label': 'What is your annual tuition budget?',
                    'type': 'select',
                    'required': True,
                    'options': [
                        {'value': '15000', 'label': '$10,000 - $20,000'},
                        {'value': '25000', 'label': '$20,000 - $30,000'},
                        {'value': '35000', 'label': '$30,000 - $40,000'},
                        {'value': '45000', 'label': '$40,000+'}
                    ]
                },
                {
                    'name': 'completion_confidence',
                    'label': 'How confident are you in completing your degree? (1-10)',
                    'type': 'number',
                    'required': True,
                    'min': 1,
                    'max': 10,
                    'placeholder': 'e.g., 8'
                },
                {
                    'name': 'email',
                    'label': 'What is your email address?',
                    'type': 'email',
                    'required': True,
                    'placeholder': 'e.g., student@example.com'
                },
                {
                    'name': 'preferred_class_size',
                    'label': 'What class size do you prefer?',
                    'type': 'select',
                    'required': True,
                    'options': [
                        {'value': 'small', 'label': 'Small classes (< 30 students)'},
                        {'value': 'medium', 'label': 'Medium classes (30-100 students)'},
                        {'value': 'large', 'label': 'Large classes (> 100 students)'}
                    ]
                },
                {
                    'name': 'financial_aid_eligible',
                    'label': 'Do you expect to need financial aid?',
                    'type': 'select',
                    'required': True,
                    'options': [
                        {'value': 'yes', 'label': 'Yes, I will need financial aid'},
                        {'value': 'no', 'label': 'No, I can afford full tuition'}
                    ]
                },
                {
                    'name': 'prefer_private',
                    'label': 'Do you prefer private institutions?',
                    'type': 'select',
                    'required': True,
                    'options': [
                        {'value': 'no', 'label': 'No, I prefer public institutions'},
                        {'value': 'yes', 'label': 'Yes, I prefer private institutions'}
                    ]
                }
            ]
        }

# Initialize the service
standardized_data_collection = StandardizedDataCollection() 