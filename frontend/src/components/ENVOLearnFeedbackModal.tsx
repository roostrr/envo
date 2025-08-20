import React, { useState } from 'react';
import { X, Star, Send } from 'lucide-react';

interface ENVOLearnFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
  isLoading: boolean;
  topic: string;
}

const ENVOLearnFeedbackModal: React.FC<ENVOLearnFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  topic
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, review);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReview('');
    setHoverRating(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-lg shadow-xl max-w-md w-full border border-dark-600">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-dark-600">
          <h2 className="text-xl font-bold text-white">Rate Your Experience</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Instructions */}
          <div className="text-center mb-6">
            <p className="text-white text-lg mb-2">
              How was your learning experience with "{topic}"?
            </p>
            <p className="text-gray-400 text-sm">
              Your feedback helps us improve ENVO Learn!
            </p>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={isLoading}
                  className={`text-3xl transition-colors ${
                    (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-500'
                  } hover:text-yellow-400 disabled:opacity-50`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Rating Label */}
          {rating > 0 && (
            <div className="text-center mb-6">
              <p className="text-white font-medium">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>
          )}

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
            <div className="flex justify-between items-center mt-2">
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
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || isLoading}
              className="flex-1 px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-cyan transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
    </div>
  );
};

export default ENVOLearnFeedbackModal;
