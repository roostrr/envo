import React, { useState } from 'react';
import { Star, Send, X } from 'lucide-react';

interface ChatFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
  isLoading?: boolean;
}

const ChatFeedbackModal: React.FC<ChatFeedbackModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, review);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReview('');
    setHoveredStar(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 p-6 rounded-lg max-w-md w-full mx-4 border border-dark-600">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Rate Your Experience</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-gray-300 text-sm mb-6">
          How was your conversation with the ENVO Chat Agent? Your feedback helps us improve!
        </p>
        
        {/* Star Rating */}
        <div className="flex justify-center mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="text-3xl mx-1 transition-colors duration-200 hover:scale-110"
              disabled={isLoading}
            >
              <span className={star <= (hoveredStar || rating) ? 'text-yellow-400' : 'text-gray-400'}>
                ★
              </span>
            </button>
          ))}
        </div>
        
        {/* Rating Labels */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-400">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
            {rating === 0 && 'Click to rate'}
          </p>
        </div>
        
        {/* Review Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Share your experience (optional)
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Tell us what you liked or how we can improve..."
            className="w-full p-3 bg-dark-700 text-white rounded-lg resize-none border border-dark-600 focus:border-neon-blue focus:outline-none transition-colors"
            rows={3}
            disabled={isLoading}
            maxLength={500}
          />
          <div className="text-right mt-1">
            <span className="text-xs text-gray-400">
              {review.length}/500
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isLoading}
            className="flex-1 bg-neon-blue text-white px-4 py-2 rounded-lg hover:bg-neon-cyan transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatFeedbackModal;
