const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const TopicVideoPool = require('../models/TopicVideoPool');
const UserSearchHistory = require('../models/UserSearchHistory');
const crypto = require('crypto');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

console.log('YOUTUBE_API_KEY:', YOUTUBE_API_KEY);
console.log('CLAUDE_API_KEY:', CLAUDE_API_KEY ? 'Loaded' : 'Missing');

// Helper: fetch YouTube video details with enhanced metadata
async function fetchVideoDetails(videoIds) {
  const ids = videoIds.join(',');
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${ids}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch video details');
  const data = await res.json();
  return data.items.map(item => ({
    video_id: item.id,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    duration: item.contentDetails.duration,
    description: item.snippet.description || '',
    thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
    viewCount: parseInt(item.statistics.viewCount || '0'),
    publishedAt: new Date(item.snippet.publishedAt)
  }));
}

// Helper: Classify video difficulty using AI
async function classifyVideoDifficulty(videos, topic) {
  console.log(`Classifying ${videos.length} videos for topic: ${topic}`);
  
  // Always ensure we have fallback classification first
  const fallbackVideos = fallbackClassification(videos);
  
  // Skip AI classification if no API key is available
  if (!CLAUDE_API_KEY) {
    console.log('CLAUDE_API_KEY not available, using fallback classification only');
    return fallbackVideos;
  }

  const classificationPrompt = `Analyze these YouTube videos about "${topic}" and classify each one as either "beginner" or "expert" level ONLY. No intermediate category.

Classification guidelines:
BEGINNER: Videos for people new to the topic
- Title keywords: "intro", "introduction", "basics", "fundamentals", "101", "tutorial", "getting started", "learn", "how to", "step by step", "for beginners"
- Simple language, assumes no prior knowledge
- Shorter explanatory videos

EXPERT: Everything else (including what would normally be intermediate)
- Title keywords: "advanced", "deep dive", "comprehensive", "complete guide", "mastery", "professional", "in-depth", "implementation", "architecture"
- Assumes some knowledge, more technical content
- Longer, detailed content
- When in doubt, classify as expert

Respond with ONLY a JSON array in this exact format:
[{"video_id": "xyz", "difficulty": "beginner", "reasoning": "brief explanation"}, ...]

Videos to classify:\n${videos.map((v, i) => `${i+1}. ID: ${v.video_id}\nTitle: ${v.title}\nChannel: ${v.channel}\nDuration: ${v.duration}\nDescription: ${v.description.substring(0, 200)}...`).join('\n\n')}`;

  try {
    console.log('Attempting AI classification...');
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2048,
        temperature: 0.3,
        messages: [{ role: 'user', content: classificationPrompt }]
      })
    });

    if (!response.ok) {
      console.error('Claude classification error:', response.status, await response.text());
      return fallbackVideos;
    }

    const data = await response.json();
    console.log('AI classification successful');
    const classifications = JSON.parse(data.content[0].text);
    
    // Apply classifications to videos
    const classifiedVideos = videos.map(video => {
      const classification = classifications.find(c => c.video_id === video.video_id);
      return {
        ...video,
        difficulty: classification?.difficulty || 'intermediate',
        classificationScore: classification ? 0.8 : 0.3
      };
    });
    
    console.log(`AI classified ${classifiedVideos.length} videos`);
    return classifiedVideos;
  } catch (error) {
    console.error('AI classification failed, using fallback:', error.message);
    return fallbackVideos;
  }
}

// Fallback classification based on simple heuristics - Beginner/Expert only
function fallbackClassification(videos) {
  console.log(`Applying fallback classification to ${videos.length} videos (Beginner/Expert only)`);
  
  const classifiedVideos = videos.map((video, index) => {
    const title = video.title.toLowerCase();
    const description = video.description.toLowerCase();
    
    let difficulty = 'expert'; // Default to expert instead of intermediate
    let score = 0.5;
    
    // Beginner indicators (stronger)
    const beginnerKeywords = ['beginner', 'intro', 'introduction', 'basics', 'fundamentals', 
                              '101', 'tutorial', 'getting started', 'start here', 'first steps',
                              'crash course', 'for dummies', 'explained simply', 'learn', 'learning',
                              'how to', 'step by step', 'easy', 'simple'];
    
    // Expert indicators (expanded with intermediate keywords)
    const expertKeywords = ['advanced', 'expert', 'deep dive', 'mastery', 'professional',
                           'master class', 'in-depth', 'comprehensive', 'complete guide',
                           'optimization', 'performance', 'architecture', 'complex',
                           'detailed', 'thorough', 'extensive', 'sophisticated',
                           'implementation', 'algorithm', 'framework', 'system design',
                           'best practices', 'production', 'scalable', 'enterprise'];
    
    // Check for beginner keywords
    const beginnerMatch = beginnerKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
    
    // Check for expert keywords
    const expertMatch = expertKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
    
    if (beginnerMatch && !expertMatch) {
      difficulty = 'beginner';
      score = 0.7;
    } else if (expertMatch || (!beginnerMatch && !expertMatch)) {
      // Default to expert for unclear cases or when expert keywords are found
      difficulty = 'expert';
      score = expertMatch ? 0.7 : 0.4;
    }
    
    return { ...video, difficulty, classificationScore: score };
  });
  
  // Ensure balanced distribution between beginner and expert
  const counts = {
    beginner: classifiedVideos.filter(v => v.difficulty === 'beginner').length,
    expert: classifiedVideos.filter(v => v.difficulty === 'expert').length
  };
  
  console.log(`Fallback classification result: Beginner: ${counts.beginner}, Expert: ${counts.expert}`);
  
  // If one category has no videos, redistribute some from the other
  if (counts.beginner === 0 && counts.expert > 0) {
    // Move some expert videos to beginner
    const videosToMove = Math.min(Math.floor(counts.expert / 2), 3);
    classifiedVideos.filter(v => v.difficulty === 'expert').slice(0, videosToMove).forEach(v => {
      v.difficulty = 'beginner';
    });
  } else if (counts.expert === 0 && counts.beginner > 0) {
    // Move some beginner videos to expert
    const videosToMove = Math.min(Math.floor(counts.beginner / 2), 3);
    classifiedVideos.filter(v => v.difficulty === 'beginner').slice(0, videosToMove).forEach(v => {
      v.difficulty = 'expert';
    });
  }
  
  const finalCounts = {
    beginner: classifiedVideos.filter(v => v.difficulty === 'beginner').length,
    expert: classifiedVideos.filter(v => v.difficulty === 'expert').length
  };
  
  console.log(`Final fallback distribution: Beginner: ${finalCounts.beginner}, Expert: ${finalCounts.expert}`);
  return classifiedVideos;
}

// Helper: Get diverse video selection avoiding recent recommendations
async function selectDiverseVideos(videoPool, topic, sessionId, userId) {
  console.log(`Selecting videos from pool of ${videoPool.length} videos for topic: ${topic}`);
  
  // Get recent search history
  const recentSearches = await UserSearchHistory.find({
    topic,
    $or: [{ sessionId }, { userId }],
    searchedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  }).sort({ searchedAt: -1 }).limit(5);

  const recentVideoIds = new Set();
  recentSearches.forEach(search => {
    search.videosShown.forEach(video => recentVideoIds.add(video.video_id));
  });

  // Group videos by difficulty (Beginner/Expert only)
  const groupedVideos = {
    beginner: videoPool.filter(v => v.difficulty === 'beginner'),
    expert: videoPool.filter(v => v.difficulty === 'expert')
  };

  console.log(`Video distribution: Beginner: ${groupedVideos.beginner.length}, Expert: ${groupedVideos.expert.length}`);
  
  // Debug: Log a sample video from each group
  if (groupedVideos.beginner.length > 0) {
    console.log('Sample beginner video:', {
      video_id: groupedVideos.beginner[0].video_id,
      title: groupedVideos.beginner[0].title,
      difficulty: groupedVideos.beginner[0].difficulty
    });
  }
  if (groupedVideos.expert.length > 0) {
    console.log('Sample expert video:', {
      video_id: groupedVideos.expert[0].video_id,
      title: groupedVideos.expert[0].title,
      difficulty: groupedVideos.expert[0].difficulty
    });
  }

  // Select up to 5 videos for each difficulty level (beginner and expert)
  const selectedVideos = [];
  const difficulties = ['beginner', 'expert'];
  const videosPerDifficulty = 5;
  
  // If we have no videos in any difficulty, try to select from the entire pool
  const totalGroupedVideos = groupedVideos.beginner.length + groupedVideos.expert.length;
  
  if (totalGroupedVideos === 0 && videoPool.length > 0) {
    console.log('No properly classified videos found, using fallback selection');
    // Fallback: select random videos from the pool and assign difficulties
    const shuffled = [...videoPool].sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(10, shuffled.length); i++) {
      const video = shuffled[i];
      // Assign difficulty if missing (alternate between beginner and expert)
      if (!video.difficulty) {
        video.difficulty = i % 2 === 0 ? 'beginner' : 'expert';
      }
      selectedVideos.push({ ...video, position: i + 1 });
    }
    return selectedVideos;
  }
  
  // First pass: Select videos for each difficulty level
  const videosByLevel = { beginner: [], expert: [] };
  
  difficulties.forEach(difficulty => {
    const availableVideos = [...groupedVideos[difficulty]]; // Copy array to avoid mutation
    const unshownVideos = availableVideos.filter(v => !recentVideoIds.has(v.video_id));
    
    // Prefer unshown videos, but use shown videos if needed
    const videosToSelectFrom = unshownVideos.length > 0 ? unshownVideos : availableVideos;
    
    // Select up to 5 videos for this difficulty
    const numToSelect = Math.min(videosPerDifficulty, videosToSelectFrom.length);
    const shuffled = [...videosToSelectFrom].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < numToSelect; i++) {
      const video = shuffled[i];
      videosByLevel[difficulty].push(video);
    }
  });

  console.log(`After first pass: Beginner: ${videosByLevel.beginner.length}, Expert: ${videosByLevel.expert.length}`);

  // Second pass: Balance the distribution to ensure 5 videos per level
  // If one level has fewer than 5 videos, try to reassign from the other level
  const totalAvailableVideos = videoPool.length;
  
  if (videosByLevel.beginner.length < 5 && videosByLevel.expert.length > 5) {
    // Move some expert videos to beginner (reclassify them)
    const needed = 5 - videosByLevel.beginner.length;
    const toMove = Math.min(needed, videosByLevel.expert.length - 5);
    
    for (let i = 0; i < toMove; i++) {
      const video = videosByLevel.expert.pop();
      if (video) {
        video.difficulty = 'beginner'; // Reclassify
        videosByLevel.beginner.push(video);
      }
    }
    console.log(`Moved ${toMove} videos from expert to beginner`);
  } else if (videosByLevel.expert.length < 5 && videosByLevel.beginner.length > 5) {
    // Move some beginner videos to expert (reclassify them)
    const needed = 5 - videosByLevel.expert.length;
    const toMove = Math.min(needed, videosByLevel.beginner.length - 5);
    
    for (let i = 0; i < toMove; i++) {
      const video = videosByLevel.beginner.pop();
      if (video) {
        video.difficulty = 'expert'; // Reclassify
        videosByLevel.expert.push(video);
      }
    }
    console.log(`Moved ${toMove} videos from beginner to expert`);
  }

  // Final pass: If we still don't have enough, look for unclassified videos from the pool
  if ((videosByLevel.beginner.length < 5 || videosByLevel.expert.length < 5) && totalAvailableVideos > 10) {
    const usedVideoIds = new Set([...videosByLevel.beginner, ...videosByLevel.expert].map(v => v.video_id));
    const unusedVideos = videoPool.filter(v => !usedVideoIds.has(v.video_id));
    
    console.log(`Found ${unusedVideos.length} unused videos for redistribution`);
    
    // Distribute unused videos to fill gaps
    let unusedIndex = 0;
    while (unusedIndex < unusedVideos.length && (videosByLevel.beginner.length < 5 || videosByLevel.expert.length < 5)) {
      const video = unusedVideos[unusedIndex];
      if (videosByLevel.beginner.length < 5) {
        video.difficulty = 'beginner';
        videosByLevel.beginner.push(video);
      } else if (videosByLevel.expert.length < 5) {
        video.difficulty = 'expert';
        videosByLevel.expert.push(video);
      }
      unusedIndex++;
    }
  }

  // Add all selected videos to the final array
  [...videosByLevel.beginner, ...videosByLevel.expert].forEach((video, index) => {
    selectedVideos.push({ 
      ...video, 
      position: index + 1 
    });
  });
  
  console.log(`Selected ${selectedVideos.length} videos: ${selectedVideos.filter(v => v.difficulty === 'beginner').length} beginner, ${selectedVideos.filter(v => v.difficulty === 'expert').length} expert`);

  console.log(`Selected ${selectedVideos.length} videos for display`);
  return selectedVideos;
}

// GET /api/youtube-search-enhanced?topic=...&sessionId=...
router.get('/youtube-search', async (req, res) => {
  const { topic, sessionId, userId, refresh } = req.query;
  if (!topic) return res.status(400).json({ error: 'Missing topic parameter' });
  
  const userSessionId = sessionId || crypto.randomBytes(16).toString('hex');
  
  try {
    // Check if we have a valid video pool for this topic
    let videoPool = await TopicVideoPool.findOne({ topic });
    let needsRefresh = !videoPool || 
      videoPool.nextRefreshDue < new Date() || 
      refresh === 'true' ||
      videoPool.videos.length < 15;

    // Also refresh if we don't have enough videos in each difficulty level
    if (videoPool && !needsRefresh) {
      const beginnerCount = videoPool.videos.filter(v => v.difficulty === 'beginner').length;
      const expertCount = videoPool.videos.filter(v => v.difficulty === 'expert').length;
      
      console.log(`Current pool distribution: ${beginnerCount} beginner, ${expertCount} expert`);
      
      // Need at least 10 videos in each category to ensure we can always show 5
      if (beginnerCount < 10 || expertCount < 10) {
        console.log('Not enough videos in one or both difficulty levels, refreshing pool');
        needsRefresh = true;
      }
    }

    if (needsRefresh) {
      console.log(`Refreshing video pool for topic: ${topic}`);
      
      // Search YouTube for more videos with varied search terms
      const searchVariations = [
        `${topic} tutorial educational`,
        `${topic} course beginner advanced`,
        `${topic} explained guide`,
        `${topic} complete comprehensive`,
        `${topic} fundamentals basics`
      ];
      
      // Rotate search terms based on how many times we've searched this topic
      const searchIndex = (videoPool ? videoPool.videos.length : 0) % searchVariations.length;
      const searchQuery = searchVariations[searchIndex];
      
      console.log(`Using search variation: "${searchQuery}"`);
      
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=50&q=${encodeURIComponent(searchQuery)}&key=${YOUTUBE_API_KEY}`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) throw new Error('YouTube search failed');
      
      const searchData = await searchRes.json();
      const videoIds = searchData.items.map(item => item.id.videoId).filter(Boolean);
      
      if (videoIds.length === 0) {
        return res.json({ 
          videos: [], 
          videosByDifficulty: { beginner: [], expert: [] },
          sessionId: userSessionId
        });
      }

      // Get detailed video information
      const videoDetails = await fetchVideoDetails(videoIds);
      
      // Filter for videos >2min and <2hours
      const filtered = videoDetails.filter(v => {
        const match = v.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const hours = parseInt(match[1] || '0');
        const mins = parseInt(match[2] || '0');
        const secs = parseInt(match[3] || '0');
        const totalSeconds = hours * 3600 + mins * 60 + secs;
        return totalSeconds > 120 && totalSeconds < 7200; // 2min to 2 hours
      });

      // Classify videos by difficulty
      const classifiedVideos = await classifyVideoDifficulty(filtered, topic);
      
      // Update or create video pool
      if (videoPool) {
        // Merge new videos with existing ones (avoid duplicates)
        const existingVideoIds = new Set(videoPool.videos.map(v => v.video_id));
        const newVideos = classifiedVideos.filter(v => !existingVideoIds.has(v.video_id));
        
        console.log(`Adding ${newVideos.length} new videos to existing pool of ${videoPool.videos.length}`);
        
        videoPool.videos = [...videoPool.videos, ...newVideos];
        videoPool.lastUpdated = new Date();
        videoPool.totalVideosAnalyzed = videoPool.videos.length;
        videoPool.nextRefreshDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await videoPool.save();
      } else {
        videoPool = new TopicVideoPool({
          topic,
          videos: classifiedVideos,
          totalVideosAnalyzed: classifiedVideos.length
        });
        await videoPool.save();
      }
    }

    // Convert Mongoose objects to plain objects for proper processing
    const plainVideos = videoPool.videos.map(video => {
      if (video.toObject) {
        return video.toObject();
      } else if (video._doc) {
        return video._doc;
      } else {
        return video;
      }
    });
    
    // Select diverse videos avoiding recent recommendations
    const selectedVideos = await selectDiverseVideos(plainVideos, topic, userSessionId, userId);
    
    console.log(`Final selected videos count: ${selectedVideos.length}`);
    console.log(`Video pool total: ${plainVideos.length}`);
    
    // Group videos by difficulty for frontend tabs (Beginner/Expert only)
    const videosByDifficulty = {
      beginner: selectedVideos.filter(v => v.difficulty === 'beginner'),
      expert: selectedVideos.filter(v => v.difficulty === 'expert')
    };
    
    console.log(`Videos by difficulty - Beginner: ${videosByDifficulty.beginner.length}, Expert: ${videosByDifficulty.expert.length}`);

    // Final fallback: if no videos were selected but we have videos in the pool, select some directly
    if (selectedVideos.length === 0 && plainVideos.length > 0) {
      console.log('Emergency fallback: selecting videos directly from pool');
      const emergencyVideos = plainVideos.slice(0, 10).map((video, index) => ({
        ...video,
        position: index + 1,
        difficulty: video.difficulty || (index % 2 === 0 ? 'beginner' : 'expert')
      }));
      
      // Update the videosByDifficulty with emergency selection
      videosByDifficulty.beginner = emergencyVideos.filter(v => v.difficulty === 'beginner');
      videosByDifficulty.expert = emergencyVideos.filter(v => v.difficulty === 'expert');
      
      console.log(`Emergency selection - Beginner: ${videosByDifficulty.beginner.length}, Expert: ${videosByDifficulty.expert.length}`);
    }

    // Record this search in history (use filtered videos for recording)
    const finalVideos = Object.values(videosByDifficulty).flat();
    console.log(`Recording search history with ${finalVideos.length} videos`);
    
    if (finalVideos.length > 0) {
      const searchHistory = new UserSearchHistory({
        sessionId: userSessionId,
        userId: userId || null,
        topic,
        videosShown: finalVideos.map(v => ({
          video_id: v.video_id,
          difficulty: v.difficulty,
          position: v.position
        }))
      });
      await searchHistory.save();
    }

    res.json({ 
      videos: finalVideos, // Return properly structured videos
      videosByDifficulty,
      sessionId: userSessionId,
      totalVideosInPool: videoPool.videos.length
    });
    
  } catch (error) {
    console.error('Enhanced YouTube search error:', error);
    res.status(500).json({ error: 'Failed to fetch educational videos' });
  }
});

// Helper: fetch transcript for a YouTube video using the Python microservice
async function fetchTranscript(videoId) {
  try {
    const url = `http://localhost:5002/get-transcript?videoId=${videoId}`;
    const res = await fetch(url);
    if (!res.ok) return '';
    const data = await res.json();
    return data.transcript || '';
  } catch (err) {
    return '';
  }
}

// POST /api/generate-summary
router.post('/generate-summary', async (req, res) => {
  const { topic, videoIds, videoMetadata, difficulty = 'general' } = req.body;
  if (!topic || (!Array.isArray(videoIds) && !videoMetadata)) {
    return res.status(400).json({ error: 'Missing topic or video data' });
  }
  
  try {
    // Fetch transcripts for each video if videoIds provided
    let transcripts = [];
    if (videoIds && Array.isArray(videoIds)) {
      for (const id of videoIds) {
        const t = await fetchTranscript(id);
        if (t) transcripts.push(t);
      }
    }

    // Create human-like, conversational summary prompt
    let summaryPrompt;
    const difficultyContext = {
      beginner: "someone who's completely new to this topic and needs foundational concepts explained clearly",
      expert: "someone with experience who wants advanced insights, detailed implementation, and comprehensive understanding", 
      general: "a curious learner"
    };

    const audienceLevel = difficultyContext[difficulty] || difficultyContext.general;

    if (transcripts.length) {
      summaryPrompt = `You are a knowledgeable educator creating an informative guide for ${audienceLevel} about "${topic}". Write a comprehensive yet accessible educational summary that balances professionalism with approachability.

Begin by explaining the relevance and importance of ${topic}, then systematically cover the key concepts. Use clear, direct language while maintaining an engaging tone. Address the reader as "you" to create connection, but keep the overall style educational and informative.

Structure your content in well-organized paragraphs that flow logically from one concept to the next. Use transitional phrases like "Additionally," "Furthermore," "It's important to note," and "Building on this concept" to maintain coherence. Include practical examples and applications where relevant.

Maintain a tone that is professional yet approachable - informative without being dry, accessible without being overly casual. Focus on clarity and understanding while keeping the reader engaged.

Based on these video transcripts:
${transcripts.join('\n---\n')}`;
    } else if (videoMetadata && videoMetadata.length) {
      summaryPrompt = `You are a knowledgeable educator creating an informative guide for ${audienceLevel} about "${topic}". Write a comprehensive yet accessible educational summary that balances professionalism with approachability.

Begin by explaining the relevance and importance of ${topic}, then systematically cover the key concepts. Use clear, direct language while maintaining an engaging tone. Address the reader as "you" to create connection, but keep the overall style educational and informative.

Structure your content in well-organized paragraphs that flow logically from one concept to the next. Use transitional phrases like "Additionally," "Furthermore," "It's important to note," and "Building on this concept" to maintain coherence. Include practical examples and applications where relevant.

Maintain a tone that is professional yet approachable - informative without being dry, accessible without being overly casual. Focus on clarity and understanding while keeping the reader engaged.

Draw insights from these educational resources:
${videoMetadata.map((v, i) => `${i + 1}. "${v.title}" by ${v.channel} (${v.duration})`).join('\n')}`;
    } else {
      return res.status(400).json({ error: 'No transcripts or metadata available for the selected videos.' });
    }

    // Claude API call with higher token limit for more conversational content
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2048,
        temperature: 0.7, // Balanced temperature for professional yet engaging content
        messages: [
          { role: 'user', content: summaryPrompt }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    res.json({ 
      summary: data.content[0].text,
      difficulty,
      audienceLevel
    });
  } catch (error) {
    console.error('AI summary generation error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// TEST ENDPOINT: Get video pool statistics for admin/debugging
router.get('/video-pool-stats', async (req, res) => {
  try {
    const pools = await TopicVideoPool.find().select('topic videos.difficulty lastUpdated totalVideosAnalyzed');
    const stats = pools.map(pool => {
      const difficultyCounts = {
        beginner: pool.videos.filter(v => v.difficulty === 'beginner').length,
        intermediate: pool.videos.filter(v => v.difficulty === 'intermediate').length,
        expert: pool.videos.filter(v => v.difficulty === 'expert').length
      };
      
      return {
        topic: pool.topic,
        totalVideos: pool.totalVideosAnalyzed,
        difficultyCounts,
        lastUpdated: pool.lastUpdated,
        averageClassificationScore: pool.videos.reduce((sum, v) => sum + (v.classificationScore || 0), 0) / pool.videos.length
      };
    });
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching video pool stats:', error);
    res.status(500).json({ error: 'Failed to fetch video pool statistics' });
  }
});

// TEST ENDPOINT: Manual video classification for validation
router.post('/test-classification', async (req, res) => {
  const { topic, maxVideos = 10 } = req.body;
  
  try {
    // Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxVideos}&q=${encodeURIComponent(topic)}&key=${YOUTUBE_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error('YouTube search failed');
    
    const searchData = await searchRes.json();
    const videoIds = searchData.items.map(item => item.id.videoId).filter(Boolean);
    
    if (videoIds.length === 0) {
      return res.json({ success: false, message: 'No videos found' });
    }
    
    // Get video details
    const videoDetails = await fetchVideoDetails(videoIds);
    
    // Classify videos
    const classifiedVideos = await classifyVideoDifficulty(videoDetails, topic);
    
    res.json({ 
      success: true, 
      topic,
      totalVideos: classifiedVideos.length,
      videos: classifiedVideos.map(v => ({
        video_id: v.video_id,
        title: v.title,
        channel: v.channel,
        difficulty: v.difficulty,
        classificationScore: v.classificationScore,
        duration: v.duration
      }))
    });
  } catch (error) {
    console.error('Test classification error:', error);
    res.status(500).json({ error: 'Failed to test classification' });
  }
});

module.exports = router; 