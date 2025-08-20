import json
import os
from typing import List, Dict, Any

class SunwayProgramsService:
    def __init__(self):
        self.programs = self.load_programs()
        self.program_clusters = self.create_program_clusters()
    
    def load_programs(self) -> List[Dict[str, Any]]:
        """Load Sunway University programs from JSON file"""
        try:
            # Try multiple possible paths
            possible_paths = [
                '../data/sunway_programs.json',
                'data/sunway_programs.json',
                '../../data/sunway_programs.json'
            ]
            
            for path in possible_paths:
                if os.path.exists(path):
                    with open(path, 'r', encoding='utf-8') as f:
                        return json.load(f)
            
            print("Warning: sunway_programs.json not found in any expected location")
            return []
        except Exception as e:
            print(f"Error loading programs: {e}")
            return []
    
    def create_program_clusters(self) -> Dict[str, List[str]]:
        """Create clusters for programs based on departments and characteristics"""
        clusters = {
            'engineering_tech': [
                'School of Engineering and Technology',
                'engineering', 'technology', 'civil', 'mechanical', 'electrical'
            ],
            'business_finance': [
                'Sunway Business School',
                'business', 'finance', 'accounting', 'management', 'marketing', 'economics'
            ],
            'computer_science': [
                'School of American Education',
                'computer science', 'artificial intelligence', 'software', 'programming'
            ],
            'arts_design': [
                'School of Arts',
                'arts', 'design', 'graphic', 'multimedia', 'interior', 'performing'
            ],
            'hospitality_tourism': [
                'School of Hospitality and Tourism Management',
                'hospitality', 'tourism', 'hotel', 'culinary', 'events'
            ],
            'medical_life_sciences': [
                'School of Medical and Life Sciences',
                'medical', 'nursing', 'healthcare', 'life sciences'
            ],
            'communication_media': [
                'School of American Education',
                'communication', 'digital', 'advertising', 'media'
            ]
        }
        return clusters
    
    def get_all_programs(self) -> List[Dict[str, Any]]:
        """Get all available programs"""
        return self.programs
    
    def get_programs_by_cluster(self, cluster_name: str) -> List[Dict[str, Any]]:
        """Get programs that match a specific cluster"""
        if cluster_name not in self.program_clusters:
            return []
        
        keywords = self.program_clusters[cluster_name]
        matching_programs = []
        
        for program in self.programs:
            program_text = f"{program.get('name', '')} {program.get('description', '')} {program.get('department', '')}".lower()
            
            for keyword in keywords:
                if keyword.lower() in program_text:
                    matching_programs.append(program)
                    break
        
        return matching_programs
    
    def get_programs_by_interest(self, interests, cluster_name=None):
        """Get programs based on academic interest and cluster"""
        try:
            if not self.programs:
                self.load_programs()
            
            # Handle both single interest and list of interests
            if isinstance(interests, str):
                interests = [interests]
            elif not isinstance(interests, list):
                interests = []
            
            # Enhanced interest mapping with better precision
            interest_mapping = {
                'business': ['business', 'management', 'finance', 'accounting', 'marketing', 'economics', 'entrepreneurship'],
                'engineering': ['engineering', 'mechanical', 'electrical', 'civil', 'chemical', 'biomedical', 'industrial'],
                'computer science': ['computer science', 'computing', 'software', 'programming', 'information technology', 'data science', 'artificial intelligence'],
                'arts': ['arts', 'design', 'graphic', 'multimedia', 'interior', 'performing', 'music', 'theater', 'visual', 'creative', 'fine arts'],
                'hospitality': ['hospitality', 'tourism', 'hotel', 'culinary', 'restaurant', 'food', 'events', 'event management'],
                'medicine': ['medicine', 'pre-med', 'medical', 'healthcare', 'nursing', 'pharmacy', 'dentistry'],
                'law': ['law', 'pre-law', 'legal', 'criminal justice', 'criminology'],
                'education': ['education', 'teaching', 'pedagogy', 'early childhood'],
                'psychology': ['psychology', 'counseling', 'mental health', 'behavioral science'],
                'social work': ['social work', 'social services', 'community', 'human services'],
                'communication': ['communication', 'digital', 'advertising', 'media', 'public relations', 'journalism'],
                'science': ['science', 'biology', 'chemistry', 'physics', 'mathematics', 'statistics'],
                'architecture': ['architecture', 'architectural', 'building', 'construction']
            }
            
            # Find matching interest categories
            matched_categories = []
            for interest in interests:
                interest_lower = interest.lower()
                for category, keywords in interest_mapping.items():
                    if any(keyword in interest_lower for keyword in keywords):
                        matched_categories.append(category)
                        break
                if not matched_categories:  # If no specific match, use the original interest
                    matched_categories.append(interest_lower)
            
            # Filter programs based on interests and cluster
            matching_programs = []
            
            for program in self.programs:
                program_name = program.get('name', '').lower()
                program_description = program.get('description', '').lower()
                department = program.get('department', '').lower()
                
                # Check if program matches any of the interests
                is_match = False
                
                for category in matched_categories:
                    # For arts, be very specific to avoid false matches
                    if category == 'arts':
                        arts_keywords = ['arts', 'design', 'graphic', 'multimedia', 'interior', 'performing', 'music', 'theater', 'visual', 'creative', 'fine arts']
                        if any(keyword in program_name for keyword in arts_keywords) or any(keyword in department for keyword in arts_keywords):
                            is_match = True
                            break
                    # For hospitality, be specific
                    elif category == 'hospitality':
                        hospitality_keywords = ['hospitality', 'tourism', 'hotel', 'culinary', 'restaurant', 'food', 'events', 'event management']
                        if any(keyword in program_name for keyword in hospitality_keywords) or any(keyword in department for keyword in hospitality_keywords):
                            is_match = True
                            break
                    # For medicine/healthcare, be specific
                    elif category == 'medicine':
                        medical_keywords = ['medicine', 'medical', 'healthcare', 'nursing', 'pharmacy', 'dentistry', 'health']
                        if any(keyword in program_name for keyword in medical_keywords) or any(keyword in department for keyword in medical_keywords):
                            is_match = True
                            break
                    # For other categories, use broader matching
                    else:
                        if category in program_name or category in department:
                            is_match = True
                            break
                        elif any(keyword in program_name for keyword in interest_mapping.get(category, [category])):
                            is_match = True
                            break
                
                # Additional cluster-based filtering to ensure relevance
                if cluster_name and is_match:
                    if cluster_name == 'elite_research':
                        # For elite research, prefer higher-level programs
                        if program.get('level') in ['Bachelor', 'Master', 'PhD']:
                            is_match = True
                        else:
                            is_match = False
                    elif cluster_name == 'small_liberal_arts':
                        # For liberal arts, prefer arts and humanities
                        if any(keyword in program_name for keyword in ['arts', 'humanities', 'social sciences', 'languages']):
                            is_match = True
                        else:
                            is_match = False
                    elif cluster_name == 'community_focused':
                        # For community focused, prefer practical programs
                        if any(keyword in program_name for keyword in ['hospitality', 'tourism', 'culinary', 'community', 'social']):
                            is_match = True
                        else:
                            is_match = False
                    elif cluster_name == 'accessible_public':
                        # For accessible public, prefer diverse programs
                        is_match = True  # Keep most programs for accessibility
                    elif cluster_name == 'premium_private':
                        # For premium private, prefer professional programs
                        if any(keyword in program_name for keyword in ['business', 'law', 'medicine', 'engineering']):
                            is_match = True
                        else:
                            is_match = False
                    elif cluster_name == 'regional_comprehensive':
                        # For regional comprehensive, prefer broad programs
                        is_match = True  # Keep most programs for comprehensiveness
                
                if is_match:
                    matching_programs.append(program)
            
            # If no matches found for specific interests, try broader matching
            if not matching_programs:
                for program in self.programs:
                    program_name = program.get('name', '').lower()
                    department = program.get('department', '').lower()
                    
                    for category in matched_categories:
                        if category in program_name or category in department:
                            matching_programs.append(program)
                            break
            
            # If still no matches, return programs from the same department
            if not matching_programs:
                for program in self.programs:
                    program_name = program.get('name', '').lower()
                    if any(keyword in program_name for keyword in interest_mapping.get(matched_categories[0] if matched_categories else 'business', ['business'])):
                        matching_programs.append(program)
            
            # If still no matches, return a subset of all programs
            if not matching_programs:
                matching_programs = self.programs[:10]
            
            # Sort by relevance and return top matches
            matching_programs.sort(key=lambda x: (
                any(category in x.get('name', '').lower() for category in matched_categories),
                any(category in x.get('department', '').lower() for category in matched_categories)
            ), reverse=True)
            
            return matching_programs[:10]  # Return top 10 matches
            
        except Exception as e:
            print(f"Error getting programs by interest: {e}")
            return self.programs[:10] if self.programs else []
    
    def get_programs_by_prediction(self, prediction: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get programs based on ML prediction results"""
        if not prediction or 'cluster' not in prediction:
            return self.programs[:5]  # Default to first 5 programs
        
        cluster = prediction['cluster']
        return self.get_programs_by_cluster(cluster)
    
    def program_matches_interest(self, program: Dict[str, Any], interest: str) -> bool:
        """Check if a program matches a specific interest"""
        try:
            program_name = program.get('name', '').lower()
            department = program.get('department', '').lower()
            description = program.get('description', '').lower()
            
            # Enhanced interest mapping for better matching
            interest_mapping = {
                'engineering': ['engineering', 'civil engineering', 'mechanical engineering', 'electrical engineering', 'technology'],
                'computer science': ['computer science', 'software engineering', 'information technology', 'data science', 'artificial intelligence', 'ai', 'computing'],
                'business': ['business', 'business management', 'business administration', 'entrepreneurship', 'management'],
                'finance': ['finance', 'financial', 'accounting', 'economics', 'banking'],
                'accounting': ['accounting', 'finance', 'financial accounting', 'audit'],
                'medicine': ['medical', 'medicine', 'health sciences', 'clinical', 'medical sciences'],
                'pre-med': ['medical', 'medicine', 'health sciences', 'pre-medical', 'medical sciences'],
                'law': ['law', 'legal studies', 'criminal justice', 'legal'],
                'pre-law': ['law', 'legal studies', 'criminal justice', 'pre-law'],
                'arts': ['arts', 'art', 'creative arts', 'fine arts', 'visual arts'],
                'design': ['design', 'graphic design', 'multimedia design', 'interior design', 'creative design'],
                'music': ['music', 'performing arts', 'musical', 'music performance'],
                'psychology': ['psychology', 'counseling', 'mental health', 'behavioral sciences'],
                'education': ['education', 'teaching', 'learning', 'pedagogy'],
                'nursing': ['nursing', 'nurse', 'healthcare', 'medical'],
                'social work': ['social work', 'social services', 'community work', 'welfare'],
                'criminal justice': ['criminal justice', 'law enforcement', 'legal studies'],
                'hospitality': ['hospitality', 'hotel management', 'tourism', 'culinary arts', 'events management'],
                'tourism': ['tourism', 'hospitality', 'hotel management', 'travel', 'events'],
                'culinary arts': ['culinary', 'cooking', 'food', 'culinary arts', 'hospitality'],
                'agriculture': ['agriculture', 'farming', 'environmental science', 'agricultural'],
                'environmental science': ['environmental', 'sustainability', 'ecology', 'environmental science'],
                'mathematics': ['mathematics', 'math', 'statistics', 'mathematical'],
                'physics': ['physics', 'engineering', 'technology', 'physical sciences'],
                'chemistry': ['chemistry', 'chemical', 'science', 'laboratory'],
                'biology': ['biology', 'life sciences', 'medical', 'biological sciences'],
                'economics': ['economics', 'finance', 'business', 'economic'],
                'political science': ['political science', 'government', 'public policy', 'politics'],
                'journalism': ['journalism', 'media', 'communication', 'digital media', 'broadcasting'],
                'communications': ['communication', 'media', 'digital communication', 'advertising', 'public relations'],
                'marketing': ['marketing', 'advertising', 'digital marketing', 'communication'],
                'management': ['management', 'business management', 'administration', 'leadership'],
                'human resources': ['human resources', 'hr', 'management', 'personnel']
            }
            
            # Get mapped keywords for the interest
            interest_lower = interest.lower()
            mapped_keywords = interest_mapping.get(interest_lower, [interest_lower])
            
            # Check if any mapped keyword matches the program
            for keyword in mapped_keywords:
                if (keyword in program_name or 
                    keyword in department or 
                    keyword in description):
                    return True
            
            return False
            
        except Exception as e:
            print(f"Error checking program interest match: {e}")
            return False
    
    def format_program_suggestions(self, programs: List[Dict[str, Any]]) -> str:
        """Format program suggestions for AI response"""
        if not programs:
            return "I couldn't find specific programs matching your profile. Please visit our website for a complete list of programs."
        
        suggestions = "Based on your profile, here are some recommended programs at Sunway University:\n\n"
        
        # Ensure we show programs from different categories/interest areas
        # First, categorize programs by their department/type
        categorized_programs = {}
        for program in programs:
            department = program.get('department', 'Unknown Department').lower()
            name = program.get('name', '').lower()
            
            # Categorize based on department and name
            category = 'other'
            if any(keyword in department or keyword in name for keyword in ['engineering', 'technology']):
                category = 'engineering'
            elif any(keyword in department or keyword in name for keyword in ['medical', 'health', 'medicine', 'nursing']):
                category = 'medical'
            elif any(keyword in department or keyword in name for keyword in ['business', 'management', 'finance']):
                category = 'business'
            elif any(keyword in department or keyword in name for keyword in ['arts', 'design', 'creative']):
                category = 'arts'
            elif any(keyword in department or keyword in name for keyword in ['computer', 'computing', 'software']):
                category = 'computing'
            elif any(keyword in department or keyword in name for keyword in ['hospitality', 'tourism']):
                category = 'hospitality'
            
            if category not in categorized_programs:
                categorized_programs[category] = []
            categorized_programs[category].append(program)
        
        # Show programs from different categories to ensure variety
        shown_programs = []
        max_per_category = 2  # Show max 2 programs per category
        
        for category, category_programs in categorized_programs.items():
            for program in category_programs[:max_per_category]:
                if len(shown_programs) < 6:  # Limit total to 6 programs
                    shown_programs.append(program)
        
        # If we don't have enough categorized programs, add more from the original list
        if len(shown_programs) < 3:
            for program in programs:
                if program not in shown_programs and len(shown_programs) < 5:
                    shown_programs.append(program)
        
        # Format the selected programs
        for i, program in enumerate(shown_programs, 1):
            name = program.get('name', 'Unknown Program')
            department = program.get('department', 'Unknown Department')
            duration = program.get('duration', 'Unknown Duration')
            tuition = program.get('tuition', 'Contact for details')
            website = program.get('website', '')
            
            suggestions += f"{i}. **{name}**\n"
            suggestions += f"   - Department: {department}\n"
            suggestions += f"   - Duration: {duration}\n"
            suggestions += f"   - Tuition: {tuition}\n"
            if website:
                suggestions += f"   - Learn more: {website}\n"
            suggestions += "\n"
        
        suggestions += "Would you like me to provide more details about any of these programs or help you with the application process?"
        return suggestions

# Initialize the service
sunway_programs_service = SunwayProgramsService() 