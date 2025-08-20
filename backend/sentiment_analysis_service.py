import nltk
import re
import logging
from nltk.sentiment import SentimentIntensityAnalyzer
from textblob import TextBlob

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SentimentAnalysisService:
    def __init__(self):
        """Initialize the sentiment analysis service"""
        try:
            # Download required NLTK data
            nltk.data.find('vader_lexicon')
            logger.info("VADER lexicon found")
        except LookupError:
            logger.info("Downloading VADER lexicon...")
            nltk.download('vader_lexicon')
            logger.info("VADER lexicon downloaded successfully")
        
        self.sia = SentimentIntensityAnalyzer()
        logger.info("SentimentAnalysisService initialized successfully")
    
    def clean_text(self, text):
        """Clean and preprocess text for sentiment analysis"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.\!\?\,]', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def analyze_sentiment(self, text):
        """Analyze sentiment of review text using VADER"""
        if not text or len(text.strip()) < 3:
            return {
                'score': 0,
                'label': 'neutral',
                'positive': 0,
                'negative': 0,
                'neutral': 1
            }
        
        try:
            # Clean text
            cleaned_text = self.clean_text(text)
            
            if not cleaned_text:
                return {
                    'score': 0,
                    'label': 'neutral',
                    'positive': 0,
                    'negative': 0,
                    'neutral': 1
                }
            
            # Get VADER sentiment scores
            scores = self.sia.polarity_scores(cleaned_text)
            
            # Determine label based on compound score
            compound_score = scores['compound']
            if compound_score >= 0.05:
                label = 'positive'
            elif compound_score <= -0.05:
                label = 'negative'
            else:
                label = 'neutral'
            
            logger.info(f"Sentiment analysis completed: {label} (score: {compound_score:.3f})")
            
            return {
                'score': compound_score,
                'label': label,
                'positive': scores['pos'],
                'negative': scores['neg'],
                'neutral': scores['neu']
            }
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            return {
                'score': 0,
                'label': 'neutral',
                'positive': 0,
                'negative': 0,
                'neutral': 1
            }
    
    def analyze_conversation_sentiment(self, messages):
        """Analyze sentiment across entire conversation"""
        if not messages or not isinstance(messages, list):
            return self.analyze_sentiment("")
        
        try:
            # Combine all message texts
            all_text = ' '.join([str(msg.get('text', '')) for msg in messages if msg.get('text')])
            return self.analyze_sentiment(all_text)
            
        except Exception as e:
            logger.error(f"Error analyzing conversation sentiment: {e}")
            return self.analyze_sentiment("")
    
    def get_sentiment_summary(self, feedback_list):
        """Generate sentiment summary from a list of feedback"""
        if not feedback_list:
            return {
                'total': 0,
                'positive_count': 0,
                'negative_count': 0,
                'neutral_count': 0,
                'average_score': 0,
                'positive_percentage': 0,
                'negative_percentage': 0,
                'neutral_percentage': 0
            }
        
        total = len(feedback_list)
        positive_count = sum(1 for f in feedback_list if f.get('sentiment_label') == 'positive')
        negative_count = sum(1 for f in feedback_list if f.get('sentiment_label') == 'negative')
        neutral_count = sum(1 for f in feedback_list if f.get('sentiment_label') == 'neutral')
        
        total_score = sum(f.get('sentiment_score', 0) for f in feedback_list)
        average_score = total_score / total if total > 0 else 0
        
        return {
            'total': total,
            'positive_count': positive_count,
            'negative_count': negative_count,
            'neutral_count': neutral_count,
            'average_score': average_score,
            'positive_percentage': (positive_count / total * 100) if total > 0 else 0,
            'negative_percentage': (negative_count / total * 100) if total > 0 else 0,
            'neutral_percentage': (neutral_count / total * 100) if total > 0 else 0
        }

# Create a global instance
sentiment_service = SentimentAnalysisService()
