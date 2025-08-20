const mongoose = require('mongoose');

const careerForecastSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Job category is required'],
    enum: [
      'technology',
      'healthcare',
      'finance',
      'education',
      'marketing',
      'engineering',
      'design',
      'sales',
      'operations',
      'research',
      'other'
    ]
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  requirements: {
    education: {
      type: String,
      enum: ['high-school', 'bachelor', 'master', 'phd', 'certification', 'any']
    },
    experience: {
      type: String,
      enum: ['entry-level', 'mid-level', 'senior', 'executive']
    },
    skills: [String]
  },
  salary: {
    min: {
      type: Number,
      required: [true, 'Minimum salary is required']
    },
    max: {
      type: Number,
      required: [true, 'Maximum salary is required']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  forecast: {
    demand: {
      type: String,
      enum: ['very-low', 'low', 'moderate', 'high', 'very-high'],
      required: [true, 'Demand forecast is required']
    },
    growth: {
      type: Number, // Percentage growth
      required: [true, 'Growth percentage is required']
    },
    trend: {
      type: String,
      enum: ['declining', 'stable', 'growing', 'booming'],
      required: [true, 'Trend is required']
    },
    confidence: {
      type: Number, // 0-100 confidence score
      min: 0,
      max: 100,
      required: [true, 'Confidence score is required']
    }
  },
  marketData: {
    currentOpenings: {
      type: Number,
      default: 0
    },
    averageSalary: {
      type: Number,
      default: 0
    },
    topCompanies: [String],
    locations: [{
      city: String,
      state: String,
      country: String,
      demand: String,
      averageSalary: Number
    }]
  },
  aiInsights: {
    automationRisk: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    remoteWorkPotential: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    skillGaps: [String],
    emergingTechnologies: [String],
    recommendations: [String]
  },
  historicalData: [{
    year: {
      type: Number,
      required: true
    },
    demand: String,
    averageSalary: Number,
    jobPostings: Number,
    growthRate: Number
  }],
  predictions: [{
    year: {
      type: Number,
      required: true
    },
    predictedDemand: String,
    predictedSalary: {
      min: Number,
      max: Number
    },
    predictedGrowth: Number,
    confidence: Number
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  dataSource: {
    type: String,
    default: 'AI Scraping'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes for better query performance
careerForecastSchema.index({ jobTitle: 'text', category: 1, industry: 1 });
careerForecastSchema.index({ 'forecast.demand': 1, 'forecast.growth': -1 });
careerForecastSchema.index({ category: 1, 'forecast.trend': 1 });
careerForecastSchema.index({ lastUpdated: -1 });

// Virtual for average salary
careerForecastSchema.virtual('averageSalary').get(function() {
  return (this.salary.min + this.salary.max) / 2;
});

// Virtual for salary range
careerForecastSchema.virtual('salaryRange').get(function() {
  return `${this.salary.currency} ${this.salary.min.toLocaleString()} - ${this.salary.max.toLocaleString()}`;
});

// Method to get demand score
careerForecastSchema.methods.getDemandScore = function() {
  const demandScores = {
    'very-low': 1,
    'low': 2,
    'moderate': 3,
    'high': 4,
    'very-high': 5
  };
  return demandScores[this.forecast.demand] || 0;
};

// Method to get trend score
careerForecastSchema.methods.getTrendScore = function() {
  const trendScores = {
    'declining': 1,
    'stable': 2,
    'growing': 3,
    'booming': 4
  };
  return trendScores[this.forecast.trend] || 0;
};

// Static method to get trending jobs
careerForecastSchema.statics.getTrendingJobs = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'forecast.growth': -1, 'forecast.confidence': -1 })
    .limit(limit);
};

// Static method to get high demand jobs
careerForecastSchema.statics.getHighDemandJobs = function(limit = 10) {
  return this.find({ 
    isActive: true, 
    'forecast.demand': { $in: ['high', 'very-high'] } 
  })
    .sort({ 'forecast.confidence': -1 })
    .limit(limit);
};

// Static method to search jobs
careerForecastSchema.statics.searchJobs = function(query, filters = {}) {
  const searchQuery = {
    isActive: true,
    ...filters
  };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  return this.find(searchQuery)
    .sort({ score: { $meta: 'textScore' }, 'forecast.confidence': -1 });
};

module.exports = mongoose.model('CareerForecast', careerForecastSchema); 