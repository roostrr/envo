import React, { useState, useRef, useEffect } from 'react';
import { Star } from 'lucide-react';
import ENVOLearnFeedbackModal from '../components/ENVOLearnFeedbackModal';

const popularTopics = [
  "Python Programming", "Machine Learning Basics", "Data Science", "Web Development",
  "Statistics for Beginners", "Calculus Made Easy", "Linear Algebra", "Critical Thinking",
  "Study Techniques", "Time Management", "Research Methods", "Academic Writing",
  "Public Speaking", "Business Management", "Financial Literacy", "Digital Marketing",
  "Quantum Physics", "Organic Chemistry", "Human Anatomy", "World History",
  "Philosophy 101", "Psychology Basics", "Graphic Design", "Music Theory"
];

interface Video {
  video_id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail?: string;
  difficulty: 'beginner' | 'expert';
  description?: string;
  position?: number;
}

interface VideosByDifficulty {
  beginner: Video[];
  expert: Video[];
}

type TabType = 'beginner' | 'expert' | 'summary';

const YouTubePage = () => {
  const [searchTopic, setSearchTopic] = useState('');
  const [showPopularTopics, setShowPopularTopics] = useState(false);

  const [videosByDifficulty, setVideosByDifficulty] = useState<VideosByDifficulty>({
    beginner: [],
    expert: []
  });
  const [summary, setSummary] = useState('');
  const [summaryDifficulty, setSummaryDifficulty] = useState<'beginner' | 'expert' | 'general'>('general');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [videosError, setVideosError] = useState('');
  const [initial, setInitial] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('beginner');
  const [sessionId, setSessionId] = useState('');
  const aiSummaryContentRef = useRef<HTMLDivElement>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [totalVideosInPool, setTotalVideosInPool] = useState(0);
  const [refreshingVideos, setRefreshingVideos] = useState(false);

  const incrementTopicSearch = async (topic: string) => {
    try {
      await fetch('/api/topic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
    } catch (err) {
      // Ignore errors for analytics
    }
  };

  // Generate session ID on component mount
  useEffect(() => {
    const existingSessionId = sessionStorage.getItem('youtube_session_id');
    if (existingSessionId) {
      setSessionId(existingSessionId);
    } else {
      const newSessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('youtube_session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent, refresh = false) => {
    e.preventDefault();
    if (!searchTopic.trim()) {
      alert('Please enter a topic to search for.');
      return;
    }
    
    setInitial(false);
    setLoadingVideos(true);
    setLoadingSummary(true);
    setSummaryError('');
    setVideosError('');
    setVideosByDifficulty({ beginner: [], expert: [] });
    setSummary('');
    setActiveTab('beginner'); // Start with beginner tab
    setRefreshingVideos(refresh);

    try {
      // Increment topic search count for analytics
      incrementTopicSearch(searchTopic);
      
      // Fetch enhanced YouTube videos with difficulty classification
      const searchParams = new URLSearchParams({
        topic: searchTopic,
        sessionId: sessionId
      });
      if (refresh) searchParams.append('refresh', 'true');
      
      const res = await fetch(`/api/youtube-search?${searchParams}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error: ${res.status}`);
      }
      
      const data = await res.json();

      setVideosByDifficulty(data.videosByDifficulty || { beginner: [], expert: [] });
      setTotalVideosInPool(data.totalVideosInPool || 0);
      setSessionId(data.sessionId); // Update session ID from server
      setLoadingVideos(false);
      setRefreshingVideos(false);
      
      const totalVideos = Object.values(data.videosByDifficulty || {}).flat().length;
      console.log('Debug info:', {
        totalVideosInPool: data.totalVideosInPool,
        totalVideosSelected: totalVideos,
        videosByDifficulty: data.videosByDifficulty
      });
      
      if (totalVideos === 0) {
        const errorMsg = data.totalVideosInPool > 0 
          ? `Found ${data.totalVideosInPool} videos but none could be properly classified. Please try a different search term or check back later.`
          : 'No relevant videos found for this topic.';
        setVideosError(errorMsg);
        setLoadingSummary(false);
        setSummaryError('No videos found to generate a summary.');
        return;
      }
      
      // Generate summary for the active difficulty level
      await generateSummaryForDifficulty('beginner', data.videosByDifficulty.beginner, refresh);
      
    } catch (error: any) {
      setLoadingVideos(false);
      setLoadingSummary(false);
      setRefreshingVideos(false);
      setSummaryError(error.message || 'An error occurred while processing your request.');
      setVideosError(error.message || 'An error occurred while processing your request.');
    }
  };

  const generateSummaryForDifficulty = async (difficulty: 'beginner' | 'expert', videosForLevel: Video[], isRefresh = false) => {
    if (videosForLevel.length === 0) {
      // Only update summary if it's not a refresh or there's no existing summary
      if (!isRefresh || !summary) {
        setSummary('No videos available for this difficulty level.');
        setSummaryDifficulty(difficulty);
      }
      setLoadingSummary(false);
      return;
    }

    // Store current summary as fallback
    const previousSummary = summary;
    const previousDifficulty = summaryDifficulty;

    try {
      const videoIds = videosForLevel.map(v => v.video_id);
      const videoMetadata = videosForLevel.map(v => ({
        video_id: v.video_id,
        title: v.title,
        channel: v.channel,
        duration: v.duration
      }));
      
      const summaryRes = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: searchTopic, 
          videoIds, 
          videoMetadata,
          difficulty 
        })
      });
      
      if (!summaryRes.ok) {
        const errorData = await summaryRes.json();
        throw new Error(errorData.error || `Error: ${summaryRes.status}`);
      }
      
      const summaryData = await summaryRes.json();
      
      // Successfully generated new summary
      setSummary(summaryData.summary || '');
      setSummaryDifficulty(difficulty);
      setLoadingSummary(false);
      setSummaryError(''); // Clear any previous errors
      
    } catch (error: any) {
      console.error('Summary generation failed:', error);
      
      if (isRefresh && previousSummary) {
        // Keep existing summary if this was a refresh and we have a previous summary
        setSummary(previousSummary);
        setSummaryDifficulty(previousDifficulty);
        setSummaryError('Could not update summary with new videos. Showing previous summary.');
        console.log('Keeping previous summary due to generation failure during refresh');
      } else {
        // No previous summary or this is an initial search
        setSummaryError(error.message || 'Failed to generate summary for this difficulty level.');
      }
      setLoadingSummary(false);
    }
  };

  const handleTabChange = async (tab: TabType) => {
    setActiveTab(tab);
    
    if (tab === 'summary') {
      // Don't regenerate summary when switching to summary tab
      return;
    }
    
    // Generate new summary for the selected difficulty level
    const videosForLevel = videosByDifficulty[tab as keyof VideosByDifficulty];
    if (videosForLevel.length > 0) {
      setLoadingSummary(true);
      setSummaryError('');
      await generateSummaryForDifficulty(tab as 'beginner' | 'expert', videosForLevel, false);
    }
  };

  const handleRefreshVideos = () => {
    const event = { preventDefault: () => {} } as React.FormEvent;
    handleSearch(event, true);
  };

  const handlePopularTopicClick = (topic: string) => {
    setSearchTopic(topic);
    setShowPopularTopics(false);
    setTimeout(() => {
      // Submit the form after modal closes
      (document.getElementById('resource-search-form') as HTMLFormElement)?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  const handleCopySummary = () => {
    if (aiSummaryContentRef.current) {
      const text = aiSummaryContentRef.current.innerText;
      navigator.clipboard.writeText(text).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }).catch(() => {
        alert('Failed to copy summary to clipboard.');
      });
    }
  };



  // Feedback submission handler
  const handleFeedback = async (rating: number, comment: string = '') => {
    setFeedbackError('');
    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/summary-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: searchTopic, 
          rating,
          comment,
          difficulty: summaryDifficulty,
          sessionId 
        })
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      setFeedbackSubmitted(true);
      setShowFeedbackModal(false);
    } catch (err) {
      setFeedbackError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const VideoCard = ({ video }: { video: Video }) => (
    <a
      href={`https://www.youtube.com/watch?v=${video.video_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-dark-800 rounded-lg shadow hover:bg-dark-700 border border-dark-600 transition-colors"
    >
      <div className="flex">
        {video.thumbnail && (
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-32 h-20 object-cover rounded-l-lg flex-shrink-0"
          />
        )}
        <div className="p-3 flex-grow">
          <div className="flex justify-between items-start mb-1">
            <h6 className="font-semibold text-white text-sm leading-tight">{video.title}</h6>
            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
              {formatDuration(video.duration)}
            </span>
          </div>
          <div className="text-xs text-gray-400">{video.channel}</div>
          <div className="text-xs text-neon-pink mt-1 capitalize">
            {video.difficulty} Level
          </div>
        </div>
      </div>
    </a>
  );

  const formatDuration = (duration: string) => {
    if (duration.includes('PT')) {
      return duration.replace('PT', '').replace('H', 'h ').replace('M', 'm ').replace('S', 's');
    }
    return duration;
  };

  const TabButton = ({ tab, label, count }: { tab: TabType; label: string; count?: number }) => {
    const isActive = activeTab === tab;
    let hasVideos = false;
    
    if (tab === 'summary') {
      hasVideos = true;
    } else {
      hasVideos = videosByDifficulty[tab as 'beginner' | 'expert']?.length > 0;
    }
    
    return (
      <button
        onClick={() => handleTabChange(tab)}
        disabled={!hasVideos}
        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
          isActive 
            ? 'bg-neon-pink text-white' 
            : hasVideos 
              ? 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              : 'bg-dark-800 text-gray-500 cursor-not-allowed'
        }`}
      >
        {label}
        {count !== undefined && count > 0 && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            isActive ? 'bg-white text-neon-pink' : 'bg-dark-600 text-gray-400'
          }`}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">ENVO Learn</h1>
        <form id="resource-search-form" className="flex flex-col sm:flex-row gap-4 mb-6" onSubmit={handleSearch}>
          <input
            id="search-topic"
            type="text"
            className="flex-1 px-4 py-2 rounded-lg border border-dark-600 bg-dark-800 text-white focus:outline-none focus:ring-2 focus:ring-neon-pink"
            placeholder="Search for a topic (e.g. Python Programming)"
            value={searchTopic}
            onChange={e => setSearchTopic(e.target.value)}
            autoComplete="off"
          />
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-neon-pink text-neon-pink hover:bg-dark-800 font-medium"
            onClick={() => setShowPopularTopics(true)}
          >
            Popular Topics
          </button>
                <button
        type="submit" 
        disabled={loadingVideos}
        className="px-4 py-2 rounded-lg bg-neon-pink text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingVideos ? 'Searching...' : 'Search'}
      </button>
        </form>

        {/* Popular Topics Modal */}
        {showPopularTopics && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-dark-900 rounded-lg shadow-lg max-w-lg w-full p-6 relative border border-dark-700">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                onClick={() => setShowPopularTopics(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-xl font-bold mb-4 text-white">Popular Topics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="popular-topics-container">
                {popularTopics.map(topic => (
                  <button
                    key={topic}
                    type="button"
                    className="btn btn-outline-primary border border-neon-pink text-neon-pink rounded-lg px-3 py-2 hover:bg-dark-800 w-full topic-btn"
                    onClick={() => handlePopularTopicClick(topic)}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Initial Content */}
        {initial && (
          <div id="initial-content" className="text-center text-gray-300 mt-12">
            <p>Search for a topic to discover curated educational videos and AI-generated summaries.</p>
          </div>
        )}

        {/* Results Section */}
        {!initial && (
          <div className="mt-8">
            {/* Header with refresh button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Learning Resources for "{searchTopic}"</h2>
              <div className="flex items-center gap-4">
                {totalVideosInPool > 0 && (
                  <span className="text-sm text-gray-400">
                    {totalVideosInPool} videos analyzed
                  </span>
                )}
                <button
                  onClick={handleRefreshVideos}
                  disabled={loadingVideos || refreshingVideos}
                  className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {refreshingVideos ? 'Refreshing...' : 'Refresh Videos'}
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-dark-600 pb-4">
              <TabButton 
                tab="beginner" 
                label="Beginner" 
                count={videosByDifficulty.beginner.length} 
              />
              <TabButton 
                tab="expert" 
                label="Expert" 
                count={videosByDifficulty.expert.length} 
              />
              <TabButton 
                tab="summary" 
                label="AI Guide" 
              />
            </div>

            {/* Loading States */}
            {loadingVideos && (
              <div className="text-center py-12">
                <div className="text-neon-pink text-lg">Analyzing videos and classifying difficulty levels...</div>
                <div className="text-gray-400 text-sm mt-2">This may take a moment</div>
              </div>
            )}

            {videosError && (
              <div className="text-center py-12">
                <div className="text-red-400 text-lg">{videosError}</div>
              </div>
            )}

            {/* Tab Content */}
            {!loadingVideos && !videosError && (
              <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
                {/* Videos Section */}
                {activeTab !== 'summary' && (
                  <div className="lg:col-span-2 mb-6 lg:mb-0">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white mb-2 capitalize">
                        {activeTab} Level Videos
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {activeTab === 'beginner' && 'Perfect for those just starting out with the basics'}
                        {activeTab === 'expert' && 'Advanced insights and comprehensive content for deeper learning'}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {videosByDifficulty[activeTab as keyof VideosByDifficulty].map((video: Video) => (
                        <VideoCard key={video.video_id} video={video} />
                      ))}
                      
                      {videosByDifficulty[activeTab as keyof VideosByDifficulty].length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <p>No {activeTab} level videos found for this topic.</p>
                          <p className="text-sm mt-2">Try a different difficulty level or search for a different topic.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Summary Section */}
                <div className={activeTab === 'summary' ? 'lg:col-span-5' : 'lg:col-span-3'}>
                  <div className="bg-dark-800 rounded-lg p-6 border border-dark-600">
                    <h3 className="text-lg font-semibold mb-4 text-white">
                      {activeTab === 'summary' ? `Complete Guide to ${searchTopic}` : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Guide`}
                    </h3>
                    
                    {loadingSummary && (
                      <div className="text-neon-pink py-4">Generating personalized guide...</div>
                    )}
                    
                    {summaryError && (
                      <div className="text-red-400 py-4">{summaryError}</div>
                    )}
                    
                    {summary && !loadingSummary && (
                      <>
                        <div
                          ref={aiSummaryContentRef}
                          className="prose prose-gray max-w-none bg-dark-700 p-4 rounded-lg mb-4 text-white border border-dark-600"
                          style={{ whiteSpace: 'pre-wrap' }}
                        >
                          {summary}
                        </div>
                        
                        {/* Feedback Button */}
                        {!feedbackSubmitted && (
                          <div className="mt-4 text-center">
                            <button
                              onClick={() => setShowFeedbackModal(true)}
                              className="bg-neon-pink text-white px-6 py-3 rounded-lg hover:bg-pink-700 flex items-center space-x-2 mx-auto"
                            >
                              <Star className="h-4 w-4" />
                              <span>Rate Your Experience</span>
                            </button>
                          </div>
                        )}
                        
                        {feedbackSubmitted && (
                          <div className="mt-4 text-green-400 font-semibold text-sm pb-4 border-b border-dark-600">
                            Thank you for your feedback!
                          </div>
                        )}
                        
                        <button
                          onClick={handleCopySummary}
                          disabled={!summary || loadingSummary}
                          className={`mt-4 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                            copySuccess 
                              ? 'bg-green-500 text-white' 
                              : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                          }`}
                        >
                          {copySuccess ? 'Copied!' : 'Copy Guide'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ENVO Learn Feedback Modal */}
      <ENVOLearnFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedback}
        isLoading={submittingFeedback}
        topic={searchTopic}
      />
    </div>
  );
};

export default YouTubePage; 