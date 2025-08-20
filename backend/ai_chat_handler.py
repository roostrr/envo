#!/usr/bin/env python3
import sys
import json
import argparse
import logging
from claude_ai_service import claude_ai_service
from ml_recruitment_service import recruitment_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description='AI Chat Handler')
    parser.add_argument('--message', required=True, help='User message')
    parser.add_argument('--student_id', required=True, help='Student ID')
    
    args = parser.parse_args()
    
    try:
        logger.info(f"Processing message for student {args.student_id}")
        logger.info(f"Message: {args.message}")
        
        # Don't load previous conversations - start fresh each time
        student_conversations = []
        
        logger.info(f"Starting fresh conversation (no previous history loaded)")
        
        # Generate AI response
        result = claude_ai_service.generate_ai_response(
            args.message, 
            args.student_id, 
            student_conversations
        )
        
        logger.info(f"AI Response generated. Confidence: {result.get('confidence', 'unknown')}")
        if result.get('prediction'):
            logger.info(f"ML Prediction: {result['prediction']}")
        
        # Only add conversation to dataset if we have sufficient data (confidence is not 'collecting_data')
        if result.get('confidence') != 'collecting_data':
            conversation = recruitment_service.add_conversation(
                args.student_id,
                args.message,
                result['response'],
                result.get('prediction')
            )
            logger.info(f"Conversation added to dataset. Total conversations: {len(recruitment_service.conversations)}")
        else:
            logger.info(f"Conversation NOT saved - still collecting data")
        
        # Return result
        response_data = {
            'response': result['response'],
            'prediction': result.get('prediction'),
            'confidence': result.get('confidence', 'low'),
            'conversation_id': len(recruitment_service.conversations) if result.get('confidence') != 'collecting_data' else 0
        }
        
        print(json.dumps(response_data, indent=2))
        
    except Exception as e:
        logger.error(f"Error in AI chat handler: {e}")
        error_response = {
            'response': f"I'm sorry, but I encountered an error: {str(e)}",
            'prediction': None,
            'confidence': 'low',
            'conversation_id': 0
        }
        print(json.dumps(error_response, indent=2))

if __name__ == "__main__":
    main() 