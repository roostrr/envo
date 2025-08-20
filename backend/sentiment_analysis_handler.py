#!/usr/bin/env python3
import sys
import json
import argparse
import logging
from sentiment_analysis_service import sentiment_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description='Sentiment Analysis Handler')
    parser.add_argument('--text', required=True, help='Text to analyze for sentiment')
    
    args = parser.parse_args()
    
    try:
        logger.info(f"Analyzing sentiment for text: {args.text[:50]}...")
        
        # Analyze sentiment
        result = sentiment_service.analyze_sentiment(args.text)
        
        # Return result as JSON
        print(json.dumps(result))
        
        logger.info(f"Sentiment analysis completed: {result['label']} (score: {result['score']:.3f})")
        
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {e}")
        # Return neutral sentiment on error
        error_result = {
            'score': 0,
            'label': 'neutral',
            'positive': 0,
            'negative': 0,
            'neutral': 1
        }
        print(json.dumps(error_result))

if __name__ == '__main__':
    main()
