import anthropic
import json
import os
from datetime import datetime
import logging
from ml_recruitment_service import recruitment_service
from sunway_programs_service import sunway_programs_service
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ClaudeAIService:
    def __init__(self):
        self.client = None
        self.api_key = os.getenv('CLAUDE_API_KEY')
        self.initialize_client()
        
    def initialize_client(self):
        """Initialize Claude API client"""
        try:
            if self.api_key:
                self.client = anthropic.Anthropic(api_key=self.api_key)
                logger.info("Claude API client initialized successfully")
            else:
                logger.error("CLAUDE_API_KEY not found in environment variables")
        except Exception as e:
            logger.error(f"Error initializing Claude client: {e}")
    
    def create_student_profile(self, student_data):
        """Create a student profile based on conversation data"""
        # Start with default profile
        profile = {
            'academic_interests': [],
            'financial_concerns': False,
            'geographic_preferences': [],
            'career_goals': [],
            'academic_level': 'undergraduate',  # default
            'family_income_level': 'unknown',
            'first_generation': False,
            'international_student': False,
            'gpa': None,
            'test_scores': None,
            'extracurriculars': [],
            'work_experience': False
        }
        
        # Update with existing student data (preserve all fields)
        if student_data:
            profile.update(student_data)
        
        return profile
    
    def generate_ai_response(self, message, student_id, conversation_history=None):
        """Generate AI response using Claude API with data collection and ML prediction"""
        try:
            if not self.client:
                return {
                    'response': "I'm sorry, but I'm currently experiencing technical difficulties. Please try again later.",
                    'prediction': None,
                    'confidence': 'low'
                }
            
            # Get student profile
            student_data = recruitment_service.students.get(student_id, {}).get('data', {})
            student_profile = self.create_student_profile(student_data)
            
            # Parse student response and update profile
            self.parse_student_response(message, student_profile)
            
            # Save updated student profile back to recruitment service
            recruitment_service.add_student({
                'id': student_id,
                'data': student_profile
            })
            
            # Check if we have enough data for ML prediction
            has_sufficient_data = self.check_sufficient_data(student_profile, conversation_history)
            
            if not has_sufficient_data:
                # Data collection phase
                response = self.collect_student_data(message, student_profile, conversation_history)
                return response
            else:
                # ML prediction and program recommendation phase
                recommendation_result = self.generate_program_recommendations(message, student_profile, conversation_history)
                return {
                    'response': recommendation_result['response'],
                    'prediction': recommendation_result.get('prediction'),
                    'confidence': recommendation_result.get('confidence', 'high')
                }
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return {
                'response': "I'm sorry, but I'm having trouble processing your request. Please try again.",
                'prediction': None,
                'confidence': 'low'
            }
    
    def check_sufficient_data(self, student_profile, conversation_history):
        """Check if we have sufficient data for ML prediction"""
        # Check if we have collected enough College Scorecard variables
        required_variables = [
            'ADM_RATE', 'PCTPELL', 'C150_4', 'RET_FT4',
            'TUITIONFEE_IN', 'TUITIONFEE_OUT', 'COSTT4_A',
            'NPT4_PUB', 'NPT4_PRIV', 'UGDS'
        ]
        
        # Check if we have at least 6 out of 10 required variables
        collected_variables = 0
        for var in required_variables:
            if student_profile.get(f'college_scorecard_{var}'):
                collected_variables += 1
        
        has_sufficient_variables = collected_variables >= 6
        
        # Check if we have conversation history
        has_conversation_history = conversation_history and len(conversation_history) >= 2
        
        return has_sufficient_variables and has_conversation_history
    
    def collect_student_data(self, message, student_profile, conversation_history):
        """Collect student data through conversation based on College Scorecard variables"""
        
        # Get current conversation state
        student_id = student_profile.get('student_id', 'default')
        conversation_state = self.get_conversation_state(student_id)
        
        # Parse the student's response first to update the profile
        self.parse_student_response(message, student_profile)
        
        # Determine what information we still need
        missing_info = self.get_missing_college_scorecard_data(student_profile)
        
        if not missing_info:
            # We have all the data, move to prediction phase
            recommendation_result = self.generate_program_recommendations(message, student_profile, conversation_history)
            return {
                'response': recommendation_result['response'],
                'prediction': recommendation_result.get('prediction'),
                'confidence': recommendation_result.get('confidence', 'high')
            }
        
        # Get the next question to ask
        next_question_data = self.get_next_college_scorecard_question(missing_info, student_profile)
        
        # Handle grouped questions
        if isinstance(next_question_data, dict) and next_question_data.get('type') == 'grouped':
            group_data = next_question_data
            
            # Format the grouped questions for display
            formatted_questions = []
            for i, question in enumerate(group_data['questions'], 1):
                formatted_questions.append(f"{i}. {question['question']}")
                for j, option in enumerate(question['options'], 1):
                    formatted_questions.append(f"   {j}. {option['label']}")
                formatted_questions.append("")
            
            system_prompt = f"""You are an AI university advisor for Sunway University. Present these questions in a clear MCQ format:

{group_data['title']}: {group_data['description']}

CRITICAL FORMATTING REQUIREMENTS:
- Present each question as a clear multiple-choice format
- Number each option clearly (1, 2, 3, 4, etc.)
- Make it easy for users to respond with just a number
- Keep responses concise and friendly
- Explain briefly why this information helps with program matching

FORMAT EXAMPLE:
Question 1: What is your GPA?
1. 3.0 - 3.2
2. 3.3 - 3.5  
3. 3.6 - 3.8
4. 3.9 - 4.0

Question 2: What are your main interests?
1. Business
2. Engineering
3. Arts & Humanities
4. Sciences

Questions:
{chr(10).join(formatted_questions)}

IMPORTANT: Ask users to respond with just the number corresponding to their choice (e.g., "1", "2", "3"). Make it clear they don't need to type full answers."""
            
            # Build conversation history
            messages = [{"role": "user", "content": system_prompt}]
            
            if conversation_history:
                for conv in conversation_history[-2:]:  # Last 2 messages for context
                    messages.append({"role": "user", "content": conv['message']})
                    messages.append({"role": "assistant", "content": conv['ai_response']})
            
            messages.append({"role": "user", "content": message})
            
            # Call Claude API
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=600,  # Allow for grouped questions
                messages=messages,
                temperature=0.7
            )
            
            ai_response = response.content[0].text
            
            # Save conversation state with updated profile
            conversation_state['student_profile'] = student_profile
            self.save_conversation_state(student_id, conversation_state)
            
            return {
                'response': ai_response,
                'prediction': None,
                'confidence': 'collecting_data'
            }
        
        # Handle single question (fallback)
        if isinstance(next_question_data, str):
            next_question = next_question_data
            question_type = self.get_question_type(next_question)
            preset_options = self.get_preset_answer_options(question_type)
        else:
            # If it's not a string, it should be a grouped question that wasn't handled
            logger.error(f"Unexpected question data format: {next_question_data}")
            return {
                'response': "I'm sorry, but I'm having trouble processing your request. Please try again.",
                'prediction': None,
                'confidence': 'low'
            }
        
        system_prompt = f"""You are an AI university advisor for Sunway University. You are collecting specific information to match students with appropriate programs.

IMPORTANT: Ask ONLY ONE question at a time. Be brief and specific. DO NOT repeat questions that have already been answered.

Current question to ask: {next_question}

CRITICAL FORMATTING REQUIREMENTS:
- Present the question as a clear multiple-choice format
- Number each option clearly (1, 2, 3, 4, etc.)
- Make it easy for users to respond with just a number
- Be friendly but concise
- Explain briefly why this information helps with program matching
- Keep responses under 100 words
- Focus on the specific variable being collected
- DO NOT ask for information that has already been provided
- If the student has already provided information, acknowledge it and move to the next question

Current student profile:
{self.format_profile_summary(student_profile)}

📊 CONVERSATION PROGRESS:
┌─────────────────────────────────────────────────────────────────────────────┐
│ STUDENT INFORMATION COLLECTED SO FAR                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ ✅ GPA: {student_profile.get('gpa', 'Not provided')}                      │
│ ✅ Income Level: {student_profile.get('family_income_level', 'Not provided')} │
│ ✅ Academic Interests: {', '.join(student_profile.get('academic_interests', [])) if student_profile.get('academic_interests') else 'Not provided'} │
│ ✅ Study Mode: {student_profile.get('fulltime_study', 'Not provided')}     │
│ ✅ International Status: {student_profile.get('international_student', 'Not provided')} │
│ ✅ Budget: {student_profile.get('tuition_budget', 'Not provided')}        │
│ ✅ Confidence: {student_profile.get('completion_confidence', 'Not provided')} │
│ ✅ Class Size Preference: {student_profile.get('preferred_class_size', 'Not provided')} │
│ ✅ Financial Aid: {student_profile.get('financial_aid_eligible', 'Not provided')} │
│ ✅ Institution Preference: {student_profile.get('prefer_private', 'Not provided')} │
└─────────────────────────────────────────────────────────────────────────────┘

📈 COMPLETION: {conversation_state['completion_percentage']:.1f}% Complete

CRITICAL INSTRUCTIONS:
1. ALWAYS check the conversation progress table above before asking any question
2. If information is marked with ✅, DO NOT ask for it again
3. Acknowledge what's already provided and ask for the NEXT missing piece
4. If all required information is collected, move to program recommendations
5. If the student just provided information, acknowledge it briefly and ask for the next missing piece
6. DO NOT repeat the same question multiple times

PRESET ANSWER OPTIONS:
Present these options in a clear numbered format:
{self.format_preset_options(preset_options)}

IMPORTANT: Ask users to respond with just the number corresponding to their choice (e.g., "1", "2", "3"). Make it clear they don't need to type full answers."""
        
        # Build conversation history
        messages = [{"role": "user", "content": system_prompt}]
        
        if conversation_history:
            for conv in conversation_history[-2:]:  # Last 2 messages for context
                messages.append({"role": "user", "content": conv['message']})
                messages.append({"role": "assistant", "content": conv['ai_response']})
        
        messages.append({"role": "user", "content": message})
        
        # Call Claude API
        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=400,  # Allow for preset options
            messages=messages,
            temperature=0.7
        )
        
        ai_response = response.content[0].text
        
        # Save conversation state with updated profile
        conversation_state['student_profile'] = student_profile
        self.save_conversation_state(student_id, conversation_state)
        
        return {
            'response': ai_response,
            'prediction': None,
            'confidence': 'collecting_data'
        }
    
    def parse_student_response(self, message, student_profile):
        """Parse student response and update profile with College Scorecard variables"""
        message_lower = message.lower().strip()
        
        # Add logging to track what's being parsed
        logger.info(f"Parsing message: '{message}' for student profile")
        
        # ===== PRESET ANSWER SELECTION PARSING =====
        # Check if user selected a preset option (1, 2, 3, 4, etc.)
        import re
        preset_selection = re.search(r'^(\d+)$', message.strip())
        if preset_selection:
            selection_number = int(preset_selection.group(1))
            # Get the current question type to determine which preset options to use
            current_question_type = self.get_current_question_type(student_profile)
            preset_options = self.get_preset_answer_options(current_question_type)
            
            if 1 <= selection_number <= len(preset_options):
                selected_option = preset_options[selection_number - 1]
                # Map the selected option to the appropriate field
                self.map_preset_selection_to_profile(selected_option, current_question_type, student_profile)
                logger.info(f"Parsed preset selection: {selection_number} → {selected_option['label']}")
                return
        
        # Check if user provided a text-based preset answer (like "3.9 - 4.0")
        current_question_type = self.get_current_question_type(student_profile)
        preset_options = self.get_preset_answer_options(current_question_type)
        
        for option in preset_options:
            if message.strip().lower() == option['label'].lower():
                # Map the selected option to the appropriate field
                self.map_preset_selection_to_profile(option, current_question_type, student_profile)
                logger.info(f"Parsed text preset selection: {message} → {option['label']}")
                return
        
        # Handle grouped responses (multiple answers in one message)
        self.parse_grouped_response(message, student_profile)
        
        # ===== INTELLIGENT RESPONSE MAPPING =====
        # The AI should map responses to standardized values that match the ML model's training data
        
        # ===== GPA PARSING FOR ADM_RATE =====
        if not student_profile.get('gpa'):
            # Comprehensive GPA patterns with intelligent mapping
            gpa_patterns = [
                r'^(\d+\.\d+)$',  # 3.5, 4.0, etc.
                r'^(\d+)$',        # 3, 4, etc.
                r'(\d+\.?\d*)\s*-\s*(\d+\.?\d*)',  # "3.9 - 4.0" or "3.5-4.0"
                r'gpa[:\s]*(\d+\.?\d*)',  # "GPA: 3.5" or "GPA 3.5"
                r'grade[:\s]*(\d+\.?\d*)',  # "Grade: 3.5" or "Grade 3.5"
                r'(\d+\.?\d*)\s*(?:gpa|grade)',  # "3.5 GPA" or "3.5 Grade"
                r'my\s+(?:gpa|grade)\s+is\s+(\d+\.?\d*)',  # "My GPA is 3.5"
                r'(\d+\.?\d*)\s+out\s+of\s+4',  # "3.5 out of 4"
                r'(\d+\.?\d*)\s+point\s+(?:gpa|grade)',  # "3.5 point GPA"
            ]
            
            for pattern in gpa_patterns:
                gpa_match = re.search(pattern, message_lower)
                if gpa_match:
                    try:
                        if len(gpa_match.groups()) == 2:  # Range pattern
                            # For ranges like "3.9 - 4.0", use the higher value
                            gpa1 = float(gpa_match.group(1))
                            gpa2 = float(gpa_match.group(2))
                            gpa = max(gpa1, gpa2)  # Use the higher value
                        else:
                            gpa = float(gpa_match.group(1))
                        
                        # Validate GPA range (0.0 to 4.0)
                        if 0.0 <= gpa <= 4.0:
                            student_profile['gpa'] = gpa
                            student_profile['college_scorecard_ADM_RATE'] = self.map_gpa_to_admission_rate(gpa)
                            logger.info(f"Parsed GPA: {gpa} → ADM_RATE: {student_profile['college_scorecard_ADM_RATE']}")
                            break
                    except ValueError:
                        continue
        
        # ===== INCOME LEVEL PARSING FOR PCTPELL =====
        if not student_profile.get('family_income_level') or student_profile.get('family_income_level') == 'unknown':
            income_indicators = ['income', 'money', 'financial', 'family', 'economic', 'budget', 'afford']
            if any(word in message_lower for word in income_indicators) or any(word in message_lower for word in ['low', 'medium', 'high', 'poor', 'rich', 'wealthy', 'struggling']):
                # Intelligent income mapping to standardized values
                income_mapping = {
                    'low': ['low', 'poor', 'struggling', 'minimum', 'barely', 'scraping', 'tight', 'limited', 'modest', 'humble'],
                    'medium': ['medium', 'middle', 'average', 'moderate', 'decent', 'reasonable', 'stable'],
                    'high': ['high', 'rich', 'wealthy', 'well-off', 'comfortable', 'affluent', 'privileged', 'upper', 'substantial']
                }
                
                for standardized_level, variations in income_mapping.items():
                    if any(word in message_lower for word in variations):
                        student_profile['family_income_level'] = standardized_level
                        # Map to standardized PCTPELL values
                        if standardized_level == 'low':
                            student_profile['college_scorecard_PCTPELL'] = 0.7  # High Pell percentage
                        elif standardized_level == 'medium':
                            student_profile['college_scorecard_PCTPELL'] = 0.4  # Moderate Pell percentage
                        else:  # high
                            student_profile['college_scorecard_PCTPELL'] = 0.2  # Low Pell percentage
                        logger.info(f"Parsed income: {standardized_level} → PCTPELL: {student_profile['college_scorecard_PCTPELL']}")
                        
                        # Apply intelligent inference for related answers
                        self.infer_related_answers(message, student_profile, 'PCTPELL', standardized_level)
                        break
        
        # ===== CONFIDENCE PARSING FOR C150_4 =====
        if not student_profile.get('completion_confidence'):
            confidence_indicators = ['confident', 'confidence', 'sure', 'certain', 'definitely', 'probably', 'likely', 'think', 'feel']
            if any(word in message_lower for word in confidence_indicators) or re.search(r'^\d+$', message.strip()):
                import re
                
                # Look for numeric confidence levels (1-10 scale)
                conf_match = re.search(r'(\d+)', message)
                if conf_match:
                    confidence = int(conf_match.group(1))
                    if 1 <= confidence <= 10:
                        student_profile['completion_confidence'] = confidence
                        student_profile['college_scorecard_C150_4'] = self.map_confidence_to_completion_rate(confidence)
                        logger.info(f"Parsed confidence: {confidence} → C150_4: {student_profile['college_scorecard_C150_4']}")
                        
                        # Apply intelligent inference for related answers
                        self.infer_related_answers(message, student_profile, 'C150_4', student_profile['college_scorecard_C150_4'])
                else:
                    # Intelligent confidence mapping based on language intensity
                    confidence_mapping = {
                        0.8: ['very', 'extremely', 'highly', 'absolutely', 'completely', 'totally', 'definitely'],
                        0.6: ['somewhat', 'moderate', 'fairly', 'reasonably', 'pretty', 'quite'],
                        0.4: ['not', 'unsure', 'uncertain', 'doubtful', 'maybe', 'possibly', 'might']
                    }
                    
                    for standardized_confidence, variations in confidence_mapping.items():
                        if any(word in message_lower for word in variations):
                            student_profile['college_scorecard_C150_4'] = standardized_confidence
                            logger.info(f"Parsed confidence: {variations[0]} → C150_4: {standardized_confidence}")
                            
                            # Apply intelligent inference for related answers
                            self.infer_related_answers(message, student_profile, 'C150_4', standardized_confidence)
                            break
                    else:
                        student_profile['college_scorecard_C150_4'] = 0.7  # Default moderate
                        logger.info(f"Parsed confidence: default → C150_4: 0.7")
                        
                        # Apply intelligent inference for related answers
                        self.infer_related_answers(message, student_profile, 'C150_4', 0.7)
        
        # ===== FULL-TIME STUDY PARSING FOR RET_FT4 =====
        if not student_profile.get('fulltime_study'):
            study_time_indicators = ['full', 'part', 'time', 'study', 'enrollment', 'load', 'course']
            if any(word in message_lower for word in study_time_indicators):
                # Intelligent study mode mapping
                study_mode_mapping = {
                    'yes': ['full', 'full-time', 'fulltime', 'complete', 'entire'],
                    'no': ['part', 'part-time', 'parttime', 'partial', 'some']
                }
                
                for standardized_mode, variations in study_mode_mapping.items():
                    if any(word in message_lower for word in variations):
                        student_profile['fulltime_study'] = standardized_mode
                        # Map to standardized RET_FT4 values
                        if standardized_mode == 'yes':
                            student_profile['college_scorecard_RET_FT4'] = 0.8  # Higher retention for full-time
                        else:
                            student_profile['college_scorecard_RET_FT4'] = 0.6  # Lower retention for part-time
                        logger.info(f"Parsed study mode: {standardized_mode} → RET_FT4: {student_profile['college_scorecard_RET_FT4']}")
                        
                        # Apply intelligent inference for related answers
                        self.infer_related_answers(message, student_profile, 'RET_FT4', student_profile['college_scorecard_RET_FT4'])
                        break
        
        # ===== INTERNATIONAL STATUS PARSING FOR TUITIONFEE_OUT =====
        if student_profile.get('international_student') is None:
            international_indicators = ['international', 'foreign', 'overseas', 'abroad', 'country', 'nationality', 'citizen', 'local', 'locally']
            if any(word in message_lower for word in international_indicators):
                # Intelligent international status mapping
                international_mapping = {
                    True: ['international', 'foreign', 'overseas', 'abroad', 'other', 'different'],
                    False: ['local', 'locally', 'domestic', 'home', 'same', 'this', 'national', 'malaysia']
                }
                
                for standardized_status, variations in international_mapping.items():
                    if any(word in message_lower for word in variations):
                        student_profile['international_student'] = standardized_status
                        # Map to standardized TUITIONFEE_OUT values
                        if standardized_status:
                            student_profile['college_scorecard_TUITIONFEE_OUT'] = 40000  # Higher for international
                        else:
                            student_profile['college_scorecard_TUITIONFEE_OUT'] = 30000  # Lower for domestic
                        logger.info(f"Parsed international status: {standardized_status} → TUITIONFEE_OUT: {student_profile['college_scorecard_TUITIONFEE_OUT']}")
                        
                        # Apply intelligent inference for related answers
                        self.infer_related_answers(message, student_profile, 'TUITIONFEE_OUT', student_profile['college_scorecard_TUITIONFEE_OUT'])
                        break
        
        # Also set TUITIONFEE_OUT if international_student is already set but TUITIONFEE_OUT is not
        if student_profile.get('international_student') is not None and not student_profile.get('college_scorecard_TUITIONFEE_OUT'):
            if student_profile['international_student']:
                student_profile['college_scorecard_TUITIONFEE_OUT'] = 40000  # Higher for international
            else:
                student_profile['college_scorecard_TUITIONFEE_OUT'] = 30000  # Lower for domestic
            logger.info(f"Set TUITIONFEE_OUT based on existing international status: {student_profile['international_student']} → TUITIONFEE_OUT: {student_profile['college_scorecard_TUITIONFEE_OUT']}")
        
        # ===== TUITION BUDGET PARSING FOR TUITIONFEE_IN =====
        if not student_profile.get('tuition_budget'):
            budget_indicators = ['budget', 'tuition', 'cost', 'dollar', '$', 'pay', 'afford', 'price', 'fee']
            if any(word in message_lower for word in budget_indicators) or re.search(r'^\d+$', message.strip()):
                import re
                
                # Look for dollar amounts with various formats
                budget_patterns = [
                    r'^\d+$',  # Standalone number like "25000"
                    r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)',  # $25,000 or $25000.50
                    r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*dollars?',  # 25000 dollars
                    r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*k',  # 25k
                    r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*thousand',  # 25 thousand
                    r'(\d+)\s*(?:dollar|buck)',  # 25000 dollar
                ]
                
                for pattern in budget_patterns:
                    budget_match = re.search(pattern, message_lower)
                    if budget_match:
                        try:
                            # Clean the number and convert to int
                            if pattern == r'^\d+$':
                                budget_str = budget_match.group(0)
                            else:
                                budget_str = budget_match.group(1).replace(',', '')
                            budget = int(float(budget_str))
                            
                            # Validate reasonable tuition range
                            if 5000 <= budget <= 100000:
                                student_profile['tuition_budget'] = budget
                                student_profile['college_scorecard_TUITIONFEE_IN'] = self.map_budget_to_tuition(budget)
                                logger.info(f"Parsed budget: ${budget} → TUITIONFEE_IN: {student_profile['college_scorecard_TUITIONFEE_IN']}")
                                
                                # Apply intelligent inference for related answers
                                self.infer_related_answers(message, student_profile, 'TUITIONFEE_IN', str(budget))
                                break
                        except (ValueError, TypeError):
                            continue
        
        # ===== TOTAL BUDGET PARSING FOR COSTT4_A =====
        if not student_profile.get('college_scorecard_COSTT4_A'):
            total_cost_indicators = ['total', 'overall', 'complete', 'entire', 'all', 'including', 'plus']
            if any(word in message_lower for word in total_cost_indicators) and any(word in message_lower for word in ['budget', 'cost', 'tuition']):
                import re
                
                # Look for total cost amounts
                total_patterns = [
                    r'total[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # "total: $50,000"
                    r'total\s+budget[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # "total budget $30,000"
                    r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*total',  # "50000 total"
                    r'including[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # "including $50,000"
                    r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*all\s+included',  # "50000 all included"
                ]
                
                for pattern in total_patterns:
                    total_match = re.search(pattern, message_lower)
                    if total_match:
                        try:
                            total_str = total_match.group(1).replace(',', '')
                            total_budget = int(float(total_str))
                            
                            # Validate reasonable total cost range
                            if 10000 <= total_budget <= 150000:
                                student_profile['total_budget'] = total_budget
                                student_profile['college_scorecard_COSTT4_A'] = self.map_total_budget_to_cost(total_budget)
                                logger.info(f"Parsed total budget: ${total_budget} → COSTT4_A: {student_profile['college_scorecard_COSTT4_A']}")
                                
                                # Apply intelligent inference for related answers
                                self.infer_related_answers(message, student_profile, 'COSTT4_A', student_profile['college_scorecard_COSTT4_A'])
                                break
                        except (ValueError, TypeError):
                            continue
        
        # ===== FINANCIAL AID PARSING FOR NPT4_PUB =====
        if not student_profile.get('financial_aid_eligible'):
            aid_indicators = ['financial aid', 'aid', 'scholarship', 'grant', 'help', 'assistance', 'support']
            if any(word in message_lower for word in aid_indicators):
                # Intelligent financial aid mapping
                aid_mapping = {
                    'yes': ['yes', 'qualify', 'eligible', 'need', 'require', 'apply', 'get', 'receive'],
                    'no': ['no', 'not', "don't", 'doesn\'t', 'ineligible', 'disqualify']
                }
                
                for standardized_eligibility, variations in aid_mapping.items():
                    if any(word in message_lower for word in variations):
                        student_profile['financial_aid_eligible'] = standardized_eligibility
                        # Map to standardized NPT4_PUB values
                        if standardized_eligibility == 'yes':
                            student_profile['college_scorecard_NPT4_PUB'] = 10000  # Lower net price with aid
                        else:
                            student_profile['college_scorecard_NPT4_PUB'] = 20000  # Higher net price without aid
                        logger.info(f"Parsed financial aid: {standardized_eligibility} → NPT4_PUB: {student_profile['college_scorecard_NPT4_PUB']}")
                        break
        
        # ===== PRIVATE INSTITUTION PREFERENCE PARSING FOR NPT4_PRIV =====
        if not student_profile.get('prefer_private'):
            private_indicators = ['private', 'public', 'institution', 'university', 'college', 'school']
            if any(word in message_lower for word in private_indicators):
                # Intelligent institution preference mapping
                institution_mapping = {
                    'yes': ['private', 'prefer', 'interested', 'consider', 'like', 'want'],
                    'no': ['public', 'state', 'government', 'prefer', 'interested']
                }
                
                for standardized_preference, variations in institution_mapping.items():
                    if any(word in message_lower for word in variations):
                        student_profile['prefer_private'] = standardized_preference
                        # Map to standardized NPT4_PRIV values
                        if standardized_preference == 'yes':
                            student_profile['college_scorecard_NPT4_PRIV'] = 30000  # Higher private net price
                        else:
                            student_profile['college_scorecard_NPT4_PRIV'] = 20000  # Lower public net price
                        logger.info(f"Parsed institution preference: {standardized_preference} → NPT4_PRIV: {student_profile['college_scorecard_NPT4_PRIV']}")
                        break
        
        # ===== CLASS SIZE PREFERENCE PARSING FOR UGDS =====
        if not student_profile.get('preferred_class_size'):
            class_size_indicators = ['class size', 'class', 'size', 'crowd', 'intimate', 'personal', 'large', 'small']
            if any(word in message_lower for word in class_size_indicators):
                # Intelligent class size mapping
                class_size_mapping = {
                    'small': ['small', 'intimate', 'personal', 'individual', 'close', 'tight'],
                    'large': ['large', 'crowded', 'big', 'huge', 'massive', 'many', 'lot'],
                    'medium': ['medium', 'moderate', 'average', 'decent', 'reasonable']
                }
                
                for standardized_size, variations in class_size_mapping.items():
                    if any(word in message_lower for word in variations):
                        student_profile['preferred_class_size'] = standardized_size
                        # Map to standardized UGDS values
                        if standardized_size == 'small':
                            student_profile['college_scorecard_UGDS'] = 2000  # Small enrollment
                        elif standardized_size == 'large':
                            student_profile['college_scorecard_UGDS'] = 15000  # Large enrollment
                        else:
                            student_profile['college_scorecard_UGDS'] = 5000  # Medium enrollment
                        logger.info(f"Parsed class size: {standardized_size} → UGDS: {student_profile['college_scorecard_UGDS']}")
                        break
        
        # ===== ACADEMIC INTERESTS PARSING =====
        # Comprehensive list of academic fields with intelligent mapping to standardized values
        academic_fields_mapping = {
            'business': ['business', 'commerce', 'management', 'administration', 'entrepreneur'],
            'engineering': ['engineering', 'engineer', 'technical', 'mechanical', 'electrical', 'civil'],
            'arts': ['arts', 'art', 'creative', 'design', 'visual', 'fine', 'performing'],
            'sciences': ['science', 'scientific', 'biology', 'chemistry', 'physics', 'natural'],
            'computing': ['computing', 'computer', 'software', 'programming', 'coding', 'it', 'information'],
            'technology': ['technology', 'tech', 'digital', 'innovation', 'ai', 'artificial'],
            'design': ['design', 'graphic', 'web', 'ui', 'ux', 'visual'],
            'hospitality': ['hospitality', 'hotel', 'tourism', 'travel', 'service', 'guest'],
            'tourism': ['tourism', 'travel', 'hospitality', 'hotel', 'tourism'],
            'finance': ['finance', 'financial', 'banking', 'investment', 'accounting', 'economics'],
            'marketing': ['marketing', 'advertising', 'promotion', 'brand', 'sales'],
            'management': ['management', 'leadership', 'administration', 'strategy', 'project'],
            'medicine': ['medicine', 'medical', 'health', 'healthcare', 'nursing', 'pharmacy'],
            'law': ['law', 'legal', 'justice', 'criminal', 'civil'],
            'education': ['education', 'teaching', 'pedagogy', 'learning', 'academic'],
            'psychology': ['psychology', 'psych', 'mental', 'behavior', 'counseling'],
            'communications': ['communications', 'communication', 'media', 'journalism', 'public'],
            'environmental': ['environmental', 'environment', 'sustainability', 'green', 'ecology'],
            'mathematics': ['mathematics', 'math', 'statistics', 'data', 'analytics'],
            'languages': ['language', 'linguistics', 'translation', 'interpretation', 'foreign']
        }
        
        for standardized_field, variations in academic_fields_mapping.items():
            if any(variation in message_lower for variation in variations):
                if 'academic_interests' not in student_profile:
                    student_profile['academic_interests'] = []
                if standardized_field not in student_profile['academic_interests']:
                    student_profile['academic_interests'].append(standardized_field)
                    logger.info(f"Parsed academic interest: {standardized_field}")
        
        # ===== SET DEFAULT VALUES FOR MISSING VARIABLES =====
        # These defaults match the historical dataset patterns
        if 'college_scorecard_CONTROL' not in student_profile:
            student_profile['college_scorecard_CONTROL'] = 1  # Public institution (most common)
        if 'college_scorecard_LOCALE' not in student_profile:
            student_profile['college_scorecard_LOCALE'] = 2  # Suburban (most common)
        
        # ===== ADDITIONAL PROFILE ENHANCEMENTS =====
        # Parse first-generation status
        first_gen_indicators = ['first generation', 'first-gen', 'firstgen', 'parents', 'family', 'college']
        if any(word in message_lower for word in first_gen_indicators):
            if any(word in message_lower for word in ['first', 'none', 'never', 'didn\'t', 'didnt']):
                student_profile['first_generation'] = True
                logger.info("Parsed first-generation status: yes")
            else:
                student_profile['first_generation'] = False
                logger.info("Parsed first-generation status: no")
        
        # Parse work experience
        work_indicators = ['work', 'job', 'employment', 'experience', 'career', 'professional']
        if any(word in message_lower for word in work_indicators):
            if any(word in message_lower for word in ['yes', 'have', 'worked', 'experience', 'employed']):
                student_profile['work_experience'] = True
                logger.info("Parsed work experience: yes")
            elif any(word in message_lower for word in ['no', 'not', 'never', 'none']):
                student_profile['work_experience'] = False
                logger.info("Parsed work experience: no")
        
        # Parse extracurricular activities
        extracurricular_indicators = ['extracurricular', 'activity', 'club', 'sport', 'volunteer', 'hobby']
        if any(word in message_lower for word in extracurricular_indicators):
            if 'extracurriculars' not in student_profile:
                student_profile['extracurriculars'] = []
            
            # Common extracurricular activities
            activities = ['sports', 'music', 'drama', 'debate', 'robotics', 'volunteer', 'leadership', 'art', 'dance']
            for activity in activities:
                if activity in message_lower and activity not in student_profile['extracurriculars']:
                    student_profile['extracurriculars'].append(activity)
                    logger.info(f"Parsed extracurricular activity: {activity}")
        
        # Log final profile state with mapping information
        logger.info(f"Final profile state: GPA={student_profile.get('gpa')}, Income={student_profile.get('family_income_level')}, Interests={student_profile.get('academic_interests')}, Study Mode={student_profile.get('fulltime_study')}, International={student_profile.get('international_student')}")
        logger.info(f"College Scorecard variables: ADM_RATE={student_profile.get('college_scorecard_ADM_RATE')}, PCTPELL={student_profile.get('college_scorecard_PCTPELL')}, C150_4={student_profile.get('college_scorecard_C150_4')}, RET_FT4={student_profile.get('college_scorecard_RET_FT4')}")
        
        # Log what was parsed in this call
        logger.info(f"=== PARSED INFORMATION FROM MESSAGE ===")
        logger.info(f"Message: '{message}'")
        logger.info(f"Updated profile fields: {list(student_profile.keys())}")
        logger.info(f"Profile after parsing: {student_profile}")
    
    def parse_grouped_response(self, message, student_profile):
        """Parse responses that contain multiple answers for grouped questions"""
        import re
        message_lower = message.lower().strip()
        
        # Define patterns for different types of grouped responses
        grouped_patterns = {
            'academic_profile': {
                'gpa_patterns': [
                    r'gpa[:\s]*(\d+\.?\d*)',
                    r'grade[:\s]*(\d+\.?\d*)',
                    r'(\d+\.?\d*)\s*(?:gpa|grade)',
                    r'(\d+\.?\d*)\s*-\s*(\d+\.?\d*)',  # GPA ranges
                ],
                'interests_patterns': [
                    r'interest[:\s]*(business|engineering|computing|arts|hospitality|medicine)',
                    r'(business|engineering|computing|arts|hospitality|medicine)',
                ]
            },
            'study_preferences': {
                'study_mode_patterns': [
                    r'study[:\s]*(full|part|time)',
                    r'(full|part)[\s-]*time',
                    r'(fulltime|parttime)',
                ],
                'confidence_patterns': [
                    r'confident[:\s]*(\d+)',
                    r'confidence[:\s]*(\d+)',
                    r'(\d+)\s*(?:out\s+of\s+10|scale)',
                ],
                'international_patterns': [
                    r'(local|international|foreign)',
                    r'(domestic|overseas)',
                ]
            },
            'financial_profile': {
                'title': 'Financial Profile',
                'description': 'Let\'s understand your financial situation:',
                'questions': [
                    {
                        'variable': 'PCTPELL',
                        'question': 'What is your family income level?',
                        'type': 'income',
                        'options': [
                            {'label': 'Low Income', 'value': 'low', 'mapped_value': 0.7},
                            {'label': 'Medium Income', 'value': 'medium', 'mapped_value': 0.4},
                            {'label': 'High Income', 'value': 'high', 'mapped_value': 0.2}
                        ]
                    },
                    {
                        'variable': 'TUITIONFEE_IN',
                        'question': 'What is your budget for tuition per year?',
                        'type': 'budget',
                        'options': [
                            {'label': '$10,000 - $20,000', 'value': '15000', 'mapped_value': 15000},
                            {'label': '$20,000 - $30,000', 'value': '25000', 'mapped_value': 25000},
                            {'label': '$30,000 - $40,000', 'value': '35000', 'mapped_value': 35000},
                            {'label': '$40,000+', 'value': '45000', 'mapped_value': 45000}
                        ]
                    },
                    {
                        'variable': 'COSTT4_A',
                        'question': 'What is your total budget including living expenses?',
                        'type': 'total_budget',
                        'options': [
                            {'label': '$15,000 - $25,000', 'value': '20000', 'mapped_value': 20000},
                            {'label': '$25,000 - $35,000', 'value': '30000', 'mapped_value': 30000},
                            {'label': '$35,000 - $45,000', 'value': '40000', 'mapped_value': 40000},
                            {'label': '$45,000+', 'value': '50000', 'mapped_value': 50000}
                        ]
                    },
                    {
                        'variable': 'NPT4_PUB',
                        'question': 'Do you expect to receive financial aid?',
                        'type': 'financial_aid',
                        'options': [
                            {'label': 'Yes, I expect significant aid', 'value': 'high_aid', 'mapped_value': 10000},
                            {'label': 'Some aid, but limited', 'value': 'medium_aid', 'mapped_value': 15000},
                            {'label': 'No, I will pay full price', 'value': 'no_aid', 'mapped_value': 20000}
                        ]
                    },
                    {
                        'variable': 'NPT4_PRIV',
                        'question': 'What type of institution do you prefer?',
                        'type': 'institution_type',
                        'options': [
                            {'label': 'Public University', 'value': 'public', 'mapped_value': 20000},
                            {'label': 'Private University', 'value': 'private', 'mapped_value': 30000}
                        ]
                    }
                ]
            },
            'campus_preferences': {
                'title': 'Campus Preferences',
                'description': 'Tell us about your campus preferences:',
                'questions': [
                    {
                        'variable': 'UGDS',
                        'question': 'What class size do you prefer?',
                        'type': 'class_size',
                        'options': [
                            {'label': 'Small Classes (< 30 students)', 'value': 'small', 'mapped_value': 2000},
                            {'label': 'Medium Classes (30-100 students)', 'value': 'medium', 'mapped_value': 5000},
                            {'label': 'Large Classes (> 100 students)', 'value': 'large', 'mapped_value': 15000}
                        ]
                    }
                ]
            }
        }
        
        # Parse each group
        for group_name, patterns in grouped_patterns.items():
            if group_name == 'academic_profile':
                # Parse GPA
                for pattern in patterns['gpa_patterns']:
                    match = re.search(pattern, message_lower)
                    if match and not student_profile.get('gpa'):
                        if len(match.groups()) == 2:  # GPA range
                            gpa = float(match.group(1))
                            student_profile['gpa'] = gpa
                            student_profile['college_scorecard_ADM_RATE'] = self.map_gpa_to_admission_rate(gpa)
                            logger.info(f"Parsed grouped GPA: {gpa}")
                            
                            # Apply intelligent inference for related answers
                            self.infer_related_answers(message, student_profile, 'ADM_RATE', student_profile['college_scorecard_ADM_RATE'])
                            break
                        elif len(match.groups()) == 1:  # Single GPA
                            gpa = float(match.group(1))
                            student_profile['gpa'] = gpa
                            student_profile['college_scorecard_ADM_RATE'] = self.map_gpa_to_admission_rate(gpa)
                            logger.info(f"Parsed grouped GPA: {gpa}")
                            
                            # Apply intelligent inference for related answers
                            self.infer_related_answers(message, student_profile, 'ADM_RATE', student_profile['college_scorecard_ADM_RATE'])
                            break
                
                # Parse academic interests
                for pattern in patterns['interests_patterns']:
                    match = re.search(pattern, message_lower)
                    if match and not student_profile.get('academic_interests'):
                        interest = match.group(1)
                        student_profile['academic_interests'] = [interest]
                        logger.info(f"Parsed grouped interest: {interest}")
                        break
            
            elif group_name == 'study_preferences':
                # Parse study mode
                for pattern in patterns['study_mode_patterns']:
                    match = re.search(pattern, message_lower)
                    if match and not student_profile.get('fulltime_study'):
                        mode = match.group(1)
                        if 'full' in mode:
                            student_profile['fulltime_study'] = 'yes'
                            student_profile['college_scorecard_RET_FT4'] = 0.8
                        else:
                            student_profile['fulltime_study'] = 'no'
                            student_profile['college_scorecard_RET_FT4'] = 0.6
                        logger.info(f"Parsed grouped study mode: {mode}")
                        
                        # Apply intelligent inference for related answers
                        self.infer_related_answers(message, student_profile, 'RET_FT4', student_profile['college_scorecard_RET_FT4'])
                        break
                
                # Parse confidence
                for pattern in patterns['confidence_patterns']:
                    match = re.search(pattern, message_lower)
                    if match and not student_profile.get('completion_confidence'):
                        confidence = int(match.group(1))
                        if 1 <= confidence <= 10:
                            student_profile['completion_confidence'] = confidence
                            student_profile['college_scorecard_C150_4'] = self.map_confidence_to_completion_rate(confidence)
                            logger.info(f"Parsed grouped confidence: {confidence}")
                            
                            # Apply intelligent inference for related answers
                            self.infer_related_answers(message, student_profile, 'C150_4', student_profile['college_scorecard_C150_4'])
                            break
                
                # Parse international status
                for pattern in patterns['international_patterns']:
                    match = re.search(pattern, message_lower)
                    if match and student_profile.get('international_student') is None:
                        status = match.group(1)
                        if status in ['international', 'foreign', 'overseas']:
                            student_profile['international_student'] = True
                            student_profile['college_scorecard_TUITIONFEE_OUT'] = 40000
                        else:
                            student_profile['international_student'] = False
                            student_profile['college_scorecard_TUITIONFEE_OUT'] = 30000
                        logger.info(f"Parsed grouped international status: {status}")
                        
                        # Apply intelligent inference for related answers
                        self.infer_related_answers(message, student_profile, 'TUITIONFEE_OUT', student_profile['college_scorecard_TUITIONFEE_OUT'])
                        break
            
            elif group_name == 'financial_profile':
                # Parse income level
                income_patterns = [
                    r'income[:\s]*(low|medium|high)',
                    r'(low|medium|high)\s*income',
                ]
                for pattern in income_patterns:
                    match = re.search(pattern, message_lower)
                    if match and not student_profile.get('family_income_level'):
                        income = match.group(1)
                        student_profile['family_income_level'] = income
                        student_profile['college_scorecard_PCTPELL'] = self.map_income_to_pell_percentage(income)
                        logger.info(f"Parsed grouped income: {income}")
                        
                        # Apply intelligent inference for related answers
                        self.infer_related_answers(message, student_profile, 'PCTPELL', income)
                        break
                
                # Parse budget
                budget_patterns = [
                    r'budget[:\s]*\$?(\d+(?:,\d{3})*)',
                    r'\$(\d+(?:,\d{3})*)',
                    r'(\d+(?:,\d{3})*)\s*(?:dollar|k|thousand)',
                ]
                for pattern in budget_patterns:
                    match = re.search(pattern, message_lower)
                    if match and not student_profile.get('tuition_budget'):
                        budget_str = match.group(1).replace(',', '')
                        budget = int(budget_str)
                        if 5000 <= budget <= 100000:
                            student_profile['tuition_budget'] = budget
                            student_profile['college_scorecard_TUITIONFEE_IN'] = self.map_budget_to_tuition(budget)
                            logger.info(f"Parsed grouped budget: {budget}")
                            
                            # Apply intelligent inference for related answers
                            self.infer_related_answers(message, student_profile, 'TUITIONFEE_IN', str(budget))
                            break
                
                # Parse total budget (COSTT4_A)
                total_budget_patterns = [
                    r'total[:\s]*\$?(\d+(?:,\d{3})*)',
                    r'cost[:\s]*\$?(\d+(?:,\d{3})*)',
                    r'expenses[:\s]*\$?(\d+(?:,\d{3})*)',
                ]
                for pattern in total_budget_patterns:
                    match = re.search(pattern, message_lower)
                    if match and not student_profile.get('college_scorecard_COSTT4_A'):
                        total_budget_str = match.group(1).replace(',', '')
                        total_budget = int(total_budget_str)
                        if 10000 <= total_budget <= 100000:
                            student_profile['college_scorecard_COSTT4_A'] = self.map_total_budget_to_cost(total_budget)
                            logger.info(f"Parsed grouped total budget: {total_budget}")
                            
                            # Apply intelligent inference for related answers
                            self.infer_related_answers(message, student_profile, 'COSTT4_A', student_profile['college_scorecard_COSTT4_A'])
                            break
                
                # Parse financial aid (NPT4_PUB)
                financial_aid_patterns = [
                    r'aid[:\s]*(yes|no|high|medium|low)',
                    r'financial[:\s]*(aid|assistance)',
                    r'(high|medium|low)\s*aid',
                ]
                for pattern in financial_aid_patterns:
                    match = re.search(pattern, message_lower)
                    if match and not student_profile.get('college_scorecard_NPT4_PUB'):
                        aid_level = match.group(1)
                        if aid_level in ['high', 'yes']:
                            student_profile['college_scorecard_NPT4_PUB'] = 10000
                        elif aid_level in ['medium']:
                            student_profile['college_scorecard_NPT4_PUB'] = 15000
                        else:
                            student_profile['college_scorecard_NPT4_PUB'] = 20000
                        logger.info(f"Parsed grouped financial aid: {aid_level}")
                        break
                
                # Parse institution type (NPT4_PRIV)
                institution_patterns = [
                    r'institution[:\s]*(public|private)',
                    r'(public|private)\s*university',
                    r'(public|private)\s*institution',
                ]
                for pattern in institution_patterns:
                    match = re.search(pattern, message_lower)
                    if match and not student_profile.get('college_scorecard_NPT4_PRIV'):
                        inst_type = match.group(1)
                        if inst_type == 'private':
                            student_profile['college_scorecard_NPT4_PRIV'] = 30000
                        else:
                            student_profile['college_scorecard_NPT4_PRIV'] = 20000
                        logger.info(f"Parsed grouped institution type: {inst_type}")
                        break
            
            elif group_name == 'campus_preferences':
                # Parse class size preference
                class_size_patterns = [
                    r'class[:\s]*(small|medium|large)',
                    r'(small|medium|large)\s*class',
                    r'(small|medium|large)\s*classes',
                    r'(\d+)\s*students?',
                ]
                for pattern in class_size_patterns:
                    match = re.search(pattern, message_lower)
                    if match and not student_profile.get('preferred_class_size'):
                        size = match.group(1)
                        student_profile['preferred_class_size'] = size
                        student_profile['college_scorecard_UGDS'] = self.map_class_size_to_enrollment(size)
                        logger.info(f"Parsed grouped class size: {size}")
                        break
    
    def get_missing_college_scorecard_data(self, student_profile):
        """Get missing College Scorecard variables"""
        required_variables = [
            'ADM_RATE', 'PCTPELL', 'C150_4', 'RET_FT4',
            'TUITIONFEE_IN', 'TUITIONFEE_OUT', 'COSTT4_A',
            'NPT4_PUB', 'NPT4_PRIV', 'UGDS'
        ]
        
        missing = []
        for var in required_variables:
            if not student_profile.get(f'college_scorecard_{var}'):
                missing.append(var)
        
        return missing
    
    def get_next_college_scorecard_question(self, missing_variables, student_profile):
        """Get grouped questions to ask based on missing variables"""
        
        # Define consolidated grouped questions with preset options - 3 smaller groups
        grouped_questions = {
            'academic_basics': {
                'title': 'Academic Basics',
                'description': 'Quick academic info:',
                'questions': [
                    {
                        'variable': 'ADM_RATE',
                        'question': 'Your GPA?',
                        'type': 'gpa',
                        'options': [
                            {'label': '3.0-3.2', 'value': '3.1', 'mapped_value': 0.7},
                            {'label': '3.3-3.5', 'value': '3.4', 'mapped_value': 0.8},
                            {'label': '3.6-3.8', 'value': '3.7', 'mapped_value': 0.9},
                            {'label': '3.9-4.0', 'value': '3.95', 'mapped_value': 0.95}
                        ]
                    },
                    {
                        'variable': 'academic_interests',
                        'question': 'Main interest?',
                        'type': 'academic_interests',
                        'options': [
                            {'label': 'Business', 'value': 'business', 'mapped_value': 'business'},
                            {'label': 'Engineering', 'value': 'engineering', 'mapped_value': 'engineering'},
                            {'label': 'Computing', 'value': 'computing', 'mapped_value': 'computing'},
                            {'label': 'Arts', 'value': 'arts', 'mapped_value': 'arts'},
                            {'label': 'Hospitality', 'value': 'hospitality', 'mapped_value': 'hospitality'},
                            {'label': 'Medicine', 'value': 'medicine', 'mapped_value': 'medicine'}
                        ]
                    },
                    {
                        'variable': 'TUITIONFEE_OUT',
                        'question': 'International student?',
                        'type': 'international',
                        'options': [
                            {'label': 'Local', 'value': 'no', 'mapped_value': 30000},
                            {'label': 'International', 'value': 'yes', 'mapped_value': 40000}
                        ]
                    }
                ]
            },
            'study_preferences': {
                'title': 'Study Preferences',
                'description': 'Study mode & confidence:',
                'questions': [
                    {
                        'variable': 'RET_FT4',
                        'question': 'Study mode?',
                        'type': 'study_mode',
                        'options': [
                            {'label': 'Full-time', 'value': 'yes', 'mapped_value': 0.8},
                            {'label': 'Part-time', 'value': 'no', 'mapped_value': 0.6}
                        ]
                    },
                    {
                        'variable': 'C150_4',
                        'question': 'Completion confidence?',
                        'type': 'confidence',
                        'options': [
                            {'label': 'Low (1-3)', 'value': '2', 'mapped_value': 0.5},
                            {'label': 'Medium (4-6)', 'value': '5', 'mapped_value': 0.6},
                            {'label': 'High (7-8)', 'value': '7.5', 'mapped_value': 0.7},
                            {'label': 'Very High (9-10)', 'value': '9.5', 'mapped_value': 0.8}
                        ]
                    },
                    {
                        'variable': 'UGDS',
                        'question': 'Class size preference?',
                        'type': 'class_size',
                        'options': [
                            {'label': 'Small (<30)', 'value': 'small', 'mapped_value': 2000},
                            {'label': 'Medium (30-100)', 'value': 'medium', 'mapped_value': 5000},
                            {'label': 'Large (>100)', 'value': 'large', 'mapped_value': 15000}
                        ]
                    }
                ]
            },
            'financial_profile': {
                'title': 'Financial Profile',
                'description': 'Budget & financial aid:',
                'questions': [
                    {
                        'variable': 'PCTPELL',
                        'question': 'Family income?',
                        'type': 'income',
                        'options': [
                            {'label': 'Low', 'value': 'low', 'mapped_value': 0.7},
                            {'label': 'Medium', 'value': 'medium', 'mapped_value': 0.4},
                            {'label': 'High', 'value': 'high', 'mapped_value': 0.2}
                        ]
                    },
                    {
                        'variable': 'TUITIONFEE_IN',
                        'question': 'Tuition budget/year?',
                        'type': 'budget',
                        'options': [
                            {'label': '$10K-20K', 'value': '15000', 'mapped_value': 15000},
                            {'label': '$20K-30K', 'value': '25000', 'mapped_value': 25000},
                            {'label': '$30K-40K', 'value': '35000', 'mapped_value': 35000},
                            {'label': '$40K+', 'value': '45000', 'mapped_value': 45000}
                        ]
                    },
                    {
                        'variable': 'COSTT4_A',
                        'question': 'Total budget (inc. living)?',
                        'type': 'total_budget',
                        'options': [
                            {'label': '$15K-25K', 'value': '20000', 'mapped_value': 20000},
                            {'label': '$25K-35K', 'value': '30000', 'mapped_value': 30000},
                            {'label': '$35K-45K', 'value': '40000', 'mapped_value': 40000},
                            {'label': '$45K+', 'value': '50000', 'mapped_value': 50000}
                        ]
                    },
                    {
                        'variable': 'NPT4_PUB',
                        'question': 'Financial aid expectation?',
                        'type': 'financial_aid',
                        'options': [
                            {'label': 'High aid needed', 'value': 'high_aid', 'mapped_value': 10000},
                            {'label': 'Some aid', 'value': 'medium_aid', 'mapped_value': 15000},
                            {'label': 'No aid needed', 'value': 'no_aid', 'mapped_value': 20000}
                        ]
                    },
                    {
                        'variable': 'NPT4_PRIV',
                        'question': 'Institution type?',
                        'type': 'institution_type',
                        'options': [
                            {'label': 'Public', 'value': 'public', 'mapped_value': 20000},
                            {'label': 'Private', 'value': 'private', 'mapped_value': 30000}
                        ]
                    }
                ]
            }
        }
        
        # Check what information is already available
        available_info = {
            'ADM_RATE': student_profile.get('gpa') is not None,
            'PCTPELL': student_profile.get('family_income_level') not in [None, 'unknown'],
            'C150_4': student_profile.get('completion_confidence') is not None,
            'RET_FT4': student_profile.get('fulltime_study') is not None,
            'TUITIONFEE_IN': student_profile.get('tuition_budget') is not None,
            'TUITIONFEE_OUT': student_profile.get('international_student') is not None,
            'COSTT4_A': student_profile.get('college_scorecard_COSTT4_A') is not None,
            'NPT4_PUB': student_profile.get('college_scorecard_NPT4_PUB') is not None,
            'NPT4_PRIV': student_profile.get('college_scorecard_NPT4_PRIV') is not None,
            'UGDS': student_profile.get('preferred_class_size') is not None,
            'academic_interests': student_profile.get('academic_interests') is not None
        }
        
        # Find the first group that has missing information
        for group_key, group_data in grouped_questions.items():
            missing_in_group = False
            group_questions = []
            
            for question_data in group_data['questions']:
                variable = question_data['variable']
                if variable in missing_variables and not available_info.get(variable, False):
                    missing_in_group = True
                    group_questions.append(question_data)
            
            if missing_in_group:
                # Return the grouped question format
                return {
                    'type': 'grouped',
                    'group_key': group_key,
                    'title': group_data['title'],
                    'description': group_data['description'],
                    'questions': group_questions
                }
        
        # If all variables are collected, move to recommendation phase
        logger.info("All required information collected, moving to recommendation phase")
        return "What are your main academic interests?"
    
    def generate_program_recommendations(self, message, student_profile, conversation_history):
        """Generate program recommendations using ML predictions"""
        # Extract features for ML prediction
        student_features = self.extract_student_features(message, student_profile)
        
        # Get ML prediction
        prediction = recruitment_service.predict_recruitment_likelihood(student_features)
        
        # Get program recommendations based on prediction
        if prediction and prediction.get('cluster'):
            programs = sunway_programs_service.get_programs_by_prediction(prediction)
        else:
            # Fallback to interest-based recommendations
            interests = student_profile.get('academic_interests', [])
            programs = sunway_programs_service.get_programs_by_interest(interests)
        
        # Create system prompt for program recommendations
        system_prompt = """You are an AI university advisor for Sunway University. You have analyzed the student's profile and are now providing personalized program recommendations.

Student Profile:
{profile_summary}

ML Analysis Results:
- Recruitment Likelihood: {likelihood}
- Recommended Program Cluster: {cluster}
- Confidence Level: {confidence}

Guidelines:
- Present programs from ALL the student's academic interests
- If the student has multiple interests (e.g., Engineering AND Medicine), ensure you mention programs from BOTH areas
- Explain why each program is recommended based on their specific interests
- Include key details like duration, tuition, and department
- Be enthusiastic about Sunway University
- Encourage the student to learn more about specific programs
- Offer to help with the application process
- Explicitly mention that you've considered all their interests when making recommendations

Program Recommendations:
{program_suggestions}

Provide a warm, encouraging response that presents these programs and guides the student toward next steps. Make sure to acknowledge that you've considered all their academic interests.""".format(
            profile_summary=self.format_profile_summary(student_profile),
            likelihood=f"{prediction['probability']*100:.1f}%" if prediction else "Analyzing...",
            cluster=prediction.get('cluster', 'General') if prediction else 'General',
            confidence=prediction.get('confidence', 'Medium') if prediction else 'Medium',
            program_suggestions=sunway_programs_service.format_program_suggestions(programs)
        )
        
        # Build conversation history
        messages = [{"role": "user", "content": system_prompt}]
        
        if conversation_history:
            for conv in conversation_history[-3:]:
                messages.append({"role": "user", "content": conv['message']})
                messages.append({"role": "assistant", "content": conv['ai_response']})
        
        messages.append({"role": "user", "content": message})
        
        # Call Claude API
        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            messages=messages,
            temperature=0.7
        )
        
        ai_response = response.content[0].text
        
        # Enhance response with prediction insights
        enhanced_response = self.enhance_response_with_prediction(ai_response, prediction)
        
        return {
            'response': enhanced_response,
            'prediction': prediction,
            'confidence': prediction['confidence'] if prediction else 'low'
        }
    
    def format_profile_summary(self, student_profile):
        """Format student profile for display"""
        summary = []
        
        if student_profile.get('academic_interests'):
            summary.append(f"Interests: {', '.join(student_profile['academic_interests'])}")
        
        if student_profile.get('family_income_level') != 'unknown':
            summary.append(f"Income Level: {student_profile['family_income_level']}")
        
        if student_profile.get('academic_level'):
            summary.append(f"Academic Level: {student_profile['academic_level']}")
        
        if student_profile.get('gpa'):
            summary.append(f"GPA: {student_profile['gpa']}")
        
        if student_profile.get('first_generation'):
            summary.append("First Generation Student: Yes")
        
        if student_profile.get('international_student'):
            summary.append("International Student: Yes")
        
        return "\n".join(summary) if summary else "Profile information being collected..."
    
    def extract_student_features(self, message, student_profile):
        """Extract features from student profile for ML prediction"""
        features = {}
        
        # Use collected College Scorecard variables
        college_scorecard_variables = [
            'ADM_RATE', 'PCTPELL', 'C150_4', 'RET_FT4',
            'TUITIONFEE_IN', 'TUITIONFEE_OUT', 'COSTT4_A',
            'NPT4_PUB', 'NPT4_PRIV', 'UGDS', 'CONTROL', 'LOCALE'
        ]
        
        for var in college_scorecard_variables:
            key = f'college_scorecard_{var}'
            if key in student_profile:
                features[var] = float(student_profile[key])
            else:
                # Use default values if not collected
                features[var] = self.get_default_value_for_variable(var)
        
        return features
    
    def get_default_value_for_variable(self, variable):
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
    
    def map_gpa_to_admission_rate(self, gpa):
        """Map GPA to admission rate"""
        if not gpa:
            return 0.7  # Default moderate admission rate
        
        gpa = float(gpa)
        if gpa >= 3.8:
            return 0.9  # High admission rate
        elif gpa >= 3.5:
            return 0.8
        elif gpa >= 3.0:
            return 0.7
        else:
            return 0.6
    
    def map_income_to_pell_percentage(self, income_level):
        """Map income level to Pell grant percentage"""
        if not income_level:
            return 0.3  # Default moderate
        
        income_level = income_level.lower()
        if income_level in ['low', 'very_low']:
            return 0.7  # High Pell percentage
        elif income_level == 'medium':
            return 0.4
        else:
            return 0.2  # Low Pell percentage
    
    def map_confidence_to_completion_rate(self, confidence):
        """Map confidence to completion rate"""
        if not confidence:
            return 0.6  # Default moderate
        
        confidence = int(confidence)
        if confidence >= 8:
            return 0.8  # High completion rate
        elif confidence >= 6:
            return 0.7
        else:
            return 0.5
    
    def map_fulltime_to_retention_rate(self, fulltime):
        """Map full-time study to retention rate"""
        if not fulltime:
            return 0.7  # Default moderate
        
        if fulltime.lower() == 'yes':
            return 0.8  # Higher retention for full-time
        else:
            return 0.6
    
    def map_budget_to_tuition(self, budget):
        """Map budget to tuition fee"""
        if not budget:
            return 25000  # Default moderate tuition
        
        budget = float(budget)
        if budget >= 40000:
            return 35000  # High tuition
        elif budget >= 25000:
            return 25000
        else:
            return 15000  # Low tuition
    
    def map_international_to_tuition(self, international):
        """Map international status to out-of-state tuition"""
        if not international:
            return 35000  # Default out-of-state
        
        if international.lower() == 'yes':
            return 40000  # Higher for international
        else:
            return 30000
    
    def map_total_budget_to_cost(self, total_budget):
        """Map total budget to cost of attendance"""
        if not total_budget:
            return 30000  # Default moderate cost
        
        total_budget = float(total_budget)
        if total_budget >= 50000:
            return 45000  # High cost
        elif total_budget >= 30000:
            return 30000
        else:
            return 20000  # Low cost
    
    def map_financial_aid_to_net_price(self, financial_aid):
        """Map financial aid eligibility to net price"""
        if not financial_aid:
            return 15000  # Default moderate net price
        
        if financial_aid.lower() == 'yes':
            return 10000  # Lower net price with aid
        else:
            return 20000
    
    def map_private_preference_to_net_price(self, prefer_private):
        """Map private preference to private net price"""
        if not prefer_private:
            return 25000  # Default moderate private net price
        
        if prefer_private.lower() == 'yes':
            return 30000  # Higher private net price
        else:
            return 20000
    
    def map_class_size_to_enrollment(self, class_size):
        """Map preferred class size to enrollment"""
        if not class_size:
            return 5000  # Default moderate enrollment
        
        class_size = class_size.lower()
        if class_size == 'small':
            return 2000  # Small enrollment
        elif class_size == 'large':
            return 15000  # Large enrollment
        else:
            return 5000  # Medium enrollment
    
    def enhance_response_with_prediction(self, ai_response, prediction):
        """Enhance AI response based on ML prediction"""
        if not prediction:
            return ai_response
        
        # Add prediction-based enhancements
        if prediction['prediction'] == 1 and prediction['probability'] > 0.7:
            # High likelihood of recruitment
            enhancement = "\n\n🎯 **Great news!** Based on your profile, you're an excellent match for Sunway University programs! Your background and interests align perfectly with our offerings."
        elif prediction['prediction'] == 1:
            # Moderate likelihood
            enhancement = "\n\n✨ **Excellent potential!** Your profile shows strong compatibility with Sunway University. We believe you'll thrive in our academic environment."
        else:
            # Lower likelihood - provide more support
            enhancement = "\n\n💡 **Every student's journey is unique!** While we've identified some areas for consideration, Sunway University offers various support programs and pathways to help you succeed."
        
        # Add cluster-specific information
        cluster = prediction.get('cluster', 'general')
        cluster_info = {
            'engineering_tech': "\n🔧 **Engineering & Technology Focus:** Our programs emphasize practical skills and industry connections.",
            'business_finance': "\n💼 **Business & Finance Excellence:** Access to real-world projects and industry partnerships.",
            'computer_science': "\n💻 **Computer Science Innovation:** Cutting-edge technology and AI-focused curriculum.",
            'arts_design': "\n🎨 **Creative Arts & Design:** State-of-the-art facilities and industry mentorship.",
            'hospitality_tourism': "\n🏨 **Hospitality & Tourism:** International partnerships and hands-on training."
        }
        
        enhancement += cluster_info.get(cluster, "\n🌟 **Personalized Learning:** Programs tailored to your interests and career goals.")
        
        # Add callback encouragement
        callback_text = "\n\n📞 **Next Steps:** Would you like to schedule a personalized consultation with our admissions team? They can provide detailed information about programs, financial aid, and application requirements tailored to your specific situation."
        
        return ai_response + enhancement + callback_text
    
    def analyze_conversation_sentiment(self, message):
        """Analyze conversation sentiment for better responses"""
        positive_words = ['interested', 'excited', 'great', 'good', 'love', 'want', 'help']
        negative_words = ['worried', 'concerned', 'expensive', 'difficult', 'hard', 'problem']
        
        message_lower = message.lower()
        
        positive_count = sum(1 for word in positive_words if word in message_lower)
        negative_count = sum(1 for word in negative_words if word in message_lower)
        
        if positive_count > negative_count:
            return 'positive'
        elif negative_count > positive_count:
            return 'negative'
        else:
            return 'neutral'
    
    def get_preset_answer_options(self, question_type):
        """Get pre-set answer options mapped to dataset values"""
        preset_options = {
            'gpa': [
                {'label': '3.0 - 3.2', 'value': '3.1', 'mapped_value': 0.7},
                {'label': '3.3 - 3.5', 'value': '3.4', 'mapped_value': 0.8},
                {'label': '3.6 - 3.8', 'value': '3.7', 'mapped_value': 0.9},
                {'label': '3.9 - 4.0', 'value': '3.95', 'mapped_value': 0.95}
            ],
            'income': [
                {'label': 'Low Income', 'value': 'low', 'mapped_value': 0.7},
                {'label': 'Medium Income', 'value': 'medium', 'mapped_value': 0.4},
                {'label': 'High Income', 'value': 'high', 'mapped_value': 0.2}
            ],
            'confidence': [
                {'label': 'Not Very Confident (1-3)', 'value': '2', 'mapped_value': 0.5},
                {'label': 'Somewhat Confident (4-6)', 'value': '5', 'mapped_value': 0.6},
                {'label': 'Confident (7-8)', 'value': '7.5', 'mapped_value': 0.7},
                {'label': 'Very Confident (9-10)', 'value': '9.5', 'mapped_value': 0.8}
            ],
            'study_mode': [
                {'label': 'Full-time', 'value': 'yes', 'mapped_value': 0.8},
                {'label': 'Part-time', 'value': 'no', 'mapped_value': 0.6}
            ],
            'international': [
                {'label': 'Local Student', 'value': 'no', 'mapped_value': 30000},
                {'label': 'International Student', 'value': 'yes', 'mapped_value': 40000}
            ],
            'budget': [
                {'label': '$10,000 - $20,000', 'value': '15000', 'mapped_value': 15000},
                {'label': '$20,000 - $30,000', 'value': '25000', 'mapped_value': 25000},
                {'label': '$30,000 - $40,000', 'value': '35000', 'mapped_value': 35000},
                {'label': '$40,000+', 'value': '45000', 'mapped_value': 45000}
            ],
            'academic_interests': [
                {'label': 'Business & Management', 'value': 'business', 'mapped_value': 'business'},
                {'label': 'Engineering & Technology', 'value': 'engineering', 'mapped_value': 'engineering'},
                {'label': 'Computer Science', 'value': 'computing', 'mapped_value': 'computing'},
                {'label': 'Arts & Design', 'value': 'arts', 'mapped_value': 'arts'},
                {'label': 'Hospitality & Tourism', 'value': 'hospitality', 'mapped_value': 'hospitality'},
                {'label': 'Medicine & Health', 'value': 'medicine', 'mapped_value': 'medicine'}
            ],
            'class_size': [
                {'label': 'Small Classes (< 30 students)', 'value': 'small', 'mapped_value': 2000},
                {'label': 'Medium Classes (30-100 students)', 'value': 'medium', 'mapped_value': 5000},
                {'label': 'Large Classes (> 100 students)', 'value': 'large', 'mapped_value': 15000}
            ],
            'financial_aid': [
                {'label': 'Yes, I need financial aid', 'value': 'yes', 'mapped_value': 10000},
                {'label': 'No, I don\'t need financial aid', 'value': 'no', 'mapped_value': 20000}
            ],
            'institution_type': [
                {'label': 'Public Institution', 'value': 'no', 'mapped_value': 20000},
                {'label': 'Private Institution', 'value': 'yes', 'mapped_value': 30000}
            ]
        }
        return preset_options.get(question_type, [])

    def get_question_type(self, question):
        """Determine the type of question being asked"""
        question_lower = question.lower()
        
        if 'gpa' in question_lower or 'grade' in question_lower:
            return 'gpa'
        elif 'income' in question_lower or 'financial' in question_lower:
            return 'income'
        elif 'confident' in question_lower or 'confidence' in question_lower:
            return 'confidence'
        elif 'full-time' in question_lower or 'part-time' in question_lower or 'study' in question_lower:
            return 'study_mode'
        elif 'international' in question_lower or 'local' in question_lower:
            return 'international'
        elif 'budget' in question_lower or 'tuition' in question_lower or 'cost' in question_lower:
            return 'budget'
        elif 'interest' in question_lower or 'field' in question_lower or 'major' in question_lower:
            return 'academic_interests'
        elif 'class size' in question_lower or 'size' in question_lower:
            return 'class_size'
        elif 'financial aid' in question_lower or 'aid' in question_lower:
            return 'financial_aid'
        elif 'private' in question_lower or 'public' in question_lower or 'institution' in question_lower:
            return 'institution_type'
        else:
            return 'general'

    def format_preset_options(self, preset_options):
        """Format preset options for display in the prompt"""
        if not preset_options:
            return "No preset options available for this question."
        
        formatted_options = []
        for i, option in enumerate(preset_options, 1):
            formatted_options.append(f"{i}. {option['label']}")
        
        return "\n".join(formatted_options)

    def get_current_question_type(self, student_profile):
        """Determine what question should be asked next based on missing information"""
        if not student_profile.get('gpa'):
            return 'gpa'
        elif not student_profile.get('family_income_level') or student_profile.get('family_income_level') == 'unknown':
            return 'income'
        elif not student_profile.get('completion_confidence'):
            return 'confidence'
        elif not student_profile.get('fulltime_study'):
            return 'study_mode'
        elif student_profile.get('international_student') is None:
            return 'international'
        elif not student_profile.get('tuition_budget'):
            return 'budget'
        elif not student_profile.get('academic_interests'):
            return 'academic_interests'
        elif not student_profile.get('preferred_class_size'):
            return 'class_size'
        elif not student_profile.get('financial_aid_eligible'):
            return 'financial_aid'
        elif not student_profile.get('prefer_private'):
            return 'institution_type'
        else:
            return 'general'

    def map_preset_selection_to_profile(self, selected_option, question_type, student_profile):
        """Map a preset selection to the appropriate profile field"""
        value = selected_option['value']
        mapped_value = selected_option['mapped_value']
        
        if question_type == 'gpa':
            student_profile['gpa'] = float(value)
            student_profile['college_scorecard_ADM_RATE'] = mapped_value
            logger.info(f"Mapped preset GPA: {value} → ADM_RATE: {mapped_value}")
            
        elif question_type == 'income':
            student_profile['family_income_level'] = value
            student_profile['college_scorecard_PCTPELL'] = mapped_value
            logger.info(f"Mapped preset income: {value} → PCTPELL: {mapped_value}")
            
        elif question_type == 'confidence':
            student_profile['completion_confidence'] = float(value)
            student_profile['college_scorecard_C150_4'] = mapped_value
            logger.info(f"Mapped preset confidence: {value} → C150_4: {mapped_value}")
            
        elif question_type == 'study_mode':
            student_profile['fulltime_study'] = value
            student_profile['college_scorecard_RET_FT4'] = mapped_value
            logger.info(f"Mapped preset study mode: {value} → RET_FT4: {mapped_value}")
            
        elif question_type == 'international':
            student_profile['international_student'] = value == 'yes'
            student_profile['college_scorecard_TUITIONFEE_OUT'] = mapped_value
            logger.info(f"Mapped preset international: {value} → TUITIONFEE_OUT: {mapped_value}")
            
        elif question_type == 'budget':
            student_profile['tuition_budget'] = int(mapped_value)
            student_profile['college_scorecard_TUITIONFEE_IN'] = mapped_value
            logger.info(f"Mapped preset budget: {value} → TUITIONFEE_IN: {mapped_value}")
            
        elif question_type == 'academic_interests':
            if 'academic_interests' not in student_profile:
                student_profile['academic_interests'] = []
            if value not in student_profile['academic_interests']:
                student_profile['academic_interests'].append(value)
            logger.info(f"Mapped preset academic interest: {value}")
            
        elif question_type == 'class_size':
            student_profile['preferred_class_size'] = value
            student_profile['college_scorecard_UGDS'] = mapped_value
            logger.info(f"Mapped preset class size: {value} → UGDS: {mapped_value}")
            
        elif question_type == 'financial_aid':
            student_profile['financial_aid_eligible'] = value
            student_profile['college_scorecard_NPT4_PUB'] = mapped_value
            logger.info(f"Mapped preset financial aid: {value} → NPT4_PUB: {mapped_value}")
            
        elif question_type == 'institution_type':
            student_profile['prefer_private'] = value
            student_profile['college_scorecard_NPT4_PRIV'] = mapped_value
            logger.info(f"Mapped preset institution type: {value} → NPT4_PRIV: {mapped_value}")

    def get_conversation_state(self, student_id):
        """Get the current conversation state for a student"""
        student_data = recruitment_service.students.get(student_id, {}).get('data', {})
        conversation_history = recruitment_service.get_conversation_history(student_id)
        
        # Determine what information has been collected
        collected_info = {
            'gpa': student_data.get('gpa') is not None,
            'income': student_data.get('family_income_level') not in [None, 'unknown'],
            'confidence': student_data.get('completion_confidence') is not None,
            'study_mode': student_data.get('fulltime_study') is not None,
            'international': student_data.get('international_student') is not None,
            'budget': student_data.get('tuition_budget') is not None,
            'academic_interests': len(student_data.get('academic_interests') or []) > 0,
            'class_size': student_data.get('preferred_class_size') is not None,
            'financial_aid': student_data.get('financial_aid_eligible') is not None,
            'institution_type': student_data.get('prefer_private') is not None
        }
        
        # Calculate completion percentage
        total_fields = len(collected_info)
        completed_fields = sum(collected_info.values())
        completion_percentage = (completed_fields / total_fields) * 100
        
        return {
            'student_id': student_id,
            'collected_info': collected_info,
            'completion_percentage': completion_percentage,
            'is_complete': completion_percentage >= 80,  # 80% threshold
            'conversation_history': conversation_history,
            'student_profile': student_data
        }

    def save_conversation_state(self, student_id, conversation_state):
        """Save the conversation state to the database"""
        try:
            # Save to recruitment service
            recruitment_service.add_student({
                'id': student_id,
                'data': conversation_state['student_profile'],
                'conversation_state': conversation_state,
                'last_updated': datetime.now().isoformat()
            })
            
            # Save conversation history
            if conversation_state.get('conversation_history'):
                recruitment_service.save_conversation_history(
                    student_id, 
                    conversation_state['conversation_history']
                )
            
            logger.info(f"Conversation state saved for student {student_id}")
            return True
        except Exception as e:
            logger.error(f"Error saving conversation state: {e}")
            return False
    
    def get_conversation_insights(self, student_id):
        """Get insights from student conversations"""
        student_conversations = [
            conv for conv in recruitment_service.conversations 
            if conv['student_id'] == student_id
        ]
        
        if not student_conversations:
            return {}
        
        insights = {
            'total_conversations': len(student_conversations),
            'avg_prediction_probability': 0,
            'callback_requests': 0,
            'common_topics': [],
            'sentiment_trend': 'neutral'
        }
        
        # Calculate average prediction probability
        predictions = [conv['prediction']['probability'] for conv in student_conversations if conv['prediction']]
        if predictions:
            insights['avg_prediction_probability'] = sum(predictions) / len(predictions)
        
        # Count callback requests
        insights['callback_requests'] = sum(1 for conv in student_conversations if conv.get('callback_requested', False))
        
        return insights

    def debug_conversation_state(self, student_id):
        """Debug function to check conversation state"""
        student_data = recruitment_service.students.get(student_id, {}).get('data', {})
        conversation_state = self.get_conversation_state(student_id)
        
        logger.info(f"=== DEBUG CONVERSATION STATE FOR STUDENT {student_id} ===")
        logger.info(f"Student data: {student_data}")
        logger.info(f"Conversation state: {conversation_state}")
        
        # Check what information is missing
        missing_info = self.get_missing_college_scorecard_data(student_data)
        logger.info(f"Missing College Scorecard variables: {missing_info}")
        
        # Check what question should be asked next
        next_question = self.get_next_college_scorecard_question(missing_info, student_data)
        logger.info(f"Next question to ask: {next_question}")
        
        return {
            'student_data': student_data,
            'conversation_state': conversation_state,
            'missing_info': missing_info,
            'next_question': next_question
        }

    def infer_related_answers(self, message, student_profile, primary_variable, primary_value):
        """
        Intelligently infer answers to related questions based on a primary answer.
        This implements the linking logic where one answer can automatically answer related questions.
        """
        import re
        
        message_lower = message.lower().strip()
        
        # Define inference rules based on primary variable and value
        inference_rules = {
            'PCTPELL': {  # Income level
                'low': {
                    'NPT4_PUB': 10000,  # Low income → high financial aid expectation
                    'NPT4_PRIV': 20000,  # Prefer public institutions (lower cost)
                    'institution_type': 'public'
                },
                'medium': {
                    'NPT4_PUB': 15000,  # Medium income → moderate financial aid
                    'NPT4_PRIV': 25000,  # Open to both public and private
                    'institution_type': 'both'
                },
                'high': {
                    'NPT4_PUB': 20000,  # High income → low financial aid expectation
                    'NPT4_PRIV': 30000,  # Can afford private institutions
                    'institution_type': 'private'
                }
            },
            'TUITIONFEE_IN': {  # Budget
                '15000': {
                    'COSTT4_A': 20000,  # Low budget → low total cost expectation
                    'NPT4_PUB': 10000,  # Need financial aid
                    'institution_type': 'public'
                },
                '25000': {
                    'COSTT4_A': 30000,  # Medium budget → medium total cost
                    'NPT4_PUB': 15000,  # Some financial aid
                    'institution_type': 'both'
                },
                '35000': {
                    'COSTT4_A': 40000,  # Higher budget → higher total cost
                    'NPT4_PUB': 20000,  # Less financial aid needed
                    'institution_type': 'both'
                },
                '45000': {
                    'COSTT4_A': 50000,  # High budget → high total cost
                    'NPT4_PUB': 20000,  # Minimal financial aid needed
                    'institution_type': 'private'
                }
            },
            'TUITIONFEE_OUT': {  # International status
                True: {
                    'COSTT4_A': 45000,  # International → higher total cost
                    'NPT4_PUB': 15000,  # May need financial aid
                    'institution_type': 'both'
                },
                False: {
                    'COSTT4_A': 30000,  # Local → lower total cost
                    'NPT4_PUB': 15000,  # Standard financial aid expectation
                    'institution_type': 'both'
                }
            },
            'C150_4': {  # Confidence level
                0.5: {
                    'RET_FT4': 0.6,  # Low confidence → lower retention expectation
                },
                0.6: {
                    'RET_FT4': 0.7,  # Moderate confidence → moderate retention
                },
                0.7: {
                    'RET_FT4': 0.8,  # High confidence → high retention
                },
                0.8: {
                    'RET_FT4': 0.9,  # Very high confidence → very high retention
                }
            },
            'RET_FT4': {  # Study mode
                0.6: {
                    'C150_4': 0.6,  # Part-time → moderate completion confidence
                },
                0.8: {
                    'C150_4': 0.8,  # Full-time → high completion confidence
                }
            }
        }
        
        # Apply inference rules
        if primary_variable in inference_rules and primary_value in inference_rules[primary_variable]:
            rules = inference_rules[primary_variable][primary_value]
            
            for inferred_variable, inferred_value in rules.items():
                # Only set if not already set
                if inferred_variable == 'NPT4_PUB' and not student_profile.get('college_scorecard_NPT4_PUB'):
                    student_profile['college_scorecard_NPT4_PUB'] = inferred_value
                    logger.info(f"Inferred NPT4_PUB: {inferred_value} from {primary_variable}={primary_value}")
                
                elif inferred_variable == 'NPT4_PRIV' and not student_profile.get('college_scorecard_NPT4_PRIV'):
                    student_profile['college_scorecard_NPT4_PRIV'] = inferred_value
                    logger.info(f"Inferred NPT4_PRIV: {inferred_value} from {primary_variable}={primary_value}")
                
                elif inferred_variable == 'COSTT4_A' and not student_profile.get('college_scorecard_COSTT4_A'):
                    student_profile['college_scorecard_COSTT4_A'] = inferred_value
                    logger.info(f"Inferred COSTT4_A: {inferred_value} from {primary_variable}={primary_value}")
                
                elif inferred_variable == 'RET_FT4' and not student_profile.get('college_scorecard_RET_FT4'):
                    student_profile['college_scorecard_RET_FT4'] = inferred_value
                    logger.info(f"Inferred RET_FT4: {inferred_value} from {primary_variable}={primary_value}")
                
                elif inferred_variable == 'C150_4' and not student_profile.get('college_scorecard_C150_4'):
                    student_profile['college_scorecard_C150_4'] = inferred_value
                    logger.info(f"Inferred C150_4: {inferred_value} from {primary_variable}={primary_value}")
                
                elif inferred_variable == 'institution_type' and not student_profile.get('institution_type_preference'):
                    student_profile['institution_type_preference'] = inferred_value
                    logger.info(f"Inferred institution_type: {inferred_value} from {primary_variable}={primary_value}")
        
        # Additional intelligent linking based on message content
        self.apply_contextual_inferences(message, student_profile)
    
    def apply_contextual_inferences(self, message, student_profile):
        """
        Apply contextual inferences based on the message content and current profile state.
        This handles more complex relationships and natural language patterns.
        """
        import re
        
        message_lower = message.lower().strip()
        
        # Scholarship/Financial Aid inferences
        if any(word in message_lower for word in ['scholarship', 'financial aid', 'need money', 'can\'t afford', 'expensive']):
            if not student_profile.get('college_scorecard_NPT4_PUB'):
                student_profile['college_scorecard_NPT4_PUB'] = 10000  # High financial aid need
                logger.info("Inferred high financial aid need from message context")
            
            if not student_profile.get('institution_type_preference'):
                student_profile['institution_type_preference'] = 'public'  # Prefer public for cost
                logger.info("Inferred public institution preference from financial context")
        
        # Academic performance inferences
        if any(word in message_lower for word in ['excellent', 'top', 'high achiever', 'straight a', 'outstanding']):
            if not student_profile.get('college_scorecard_C150_4'):
                student_profile['college_scorecard_C150_4'] = 0.9  # High completion confidence
                logger.info("Inferred high completion confidence from academic excellence")
            
            if not student_profile.get('college_scorecard_ADM_RATE'):
                student_profile['college_scorecard_ADM_RATE'] = 0.95  # High admission rate
                logger.info("Inferred high admission rate from academic excellence")
        
        # Budget constraints inferences
        if any(word in message_lower for word in ['budget', 'affordable', 'cheap', 'cost-effective', 'value']):
            if not student_profile.get('college_scorecard_COSTT4_A'):
                student_profile['college_scorecard_COSTT4_A'] = 25000  # Moderate total cost
                logger.info("Inferred moderate total cost from budget-conscious language")
            
            if not student_profile.get('institution_type_preference'):
                student_profile['institution_type_preference'] = 'public'  # Prefer public for cost
                logger.info("Inferred public institution preference from budget language")
        
        # International student specific inferences
        if student_profile.get('international_student'):
            if not student_profile.get('college_scorecard_COSTT4_A'):
                student_profile['college_scorecard_COSTT4_A'] = 45000  # Higher total cost for international
                logger.info("Inferred higher total cost for international student")
            
            if not student_profile.get('college_scorecard_NPT4_PUB'):
                student_profile['college_scorecard_NPT4_PUB'] = 15000  # May need financial aid
                logger.info("Inferred financial aid need for international student")

# Initialize the service
claude_ai_service = ClaudeAIService() 