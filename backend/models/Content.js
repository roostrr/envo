const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Content type is required'],
    enum: [
      'page',
      'section',
      'banner',
      'footer',
      'navigation',
      'modal',
      'notification'
    ]
  },
  identifier: {
    type: String,
    required: [true, 'Content identifier is required'],
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Content title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Content is required']
  },
  metadata: {
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    keywords: [String],
    author: String,
    version: {
      type: Number,
      default: 1
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  styling: {
    cssClass: String,
    inlineStyles: String,
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },
  visibility: {
    isPublic: {
      type: Boolean,
      default: true
    },
    userTypes: [{
      type: String,
      enum: ['admin', 'institution', 'regular', 'all']
    }],
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  localization: {
    language: {
      type: String,
      default: 'en'
    },
    translations: [{
      language: String,
      title: String,
      content: mongoose.Schema.Types.Mixed
    }]
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    canonicalUrl: String
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    lastViewed: Date,
    engagement: {
      clicks: {
        type: Number,
        default: 0
      },
      timeSpent: {
        type: Number,
        default: 0
      }
    }
  },
  permissions: {
    canEdit: [{
      type: String,
      enum: ['admin', 'institution', 'regular']
    }],
    canView: [{
      type: String,
      enum: ['admin', 'institution', 'regular', 'public']
    }]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
contentSchema.index({ type: 1, identifier: 1 });
contentSchema.index({ 'visibility.isActive': 1, 'visibility.isPublic': 1 });
contentSchema.index({ 'localization.language': 1 });
contentSchema.index({ 'permissions.canView': 1 });

// Virtual for full identifier
contentSchema.virtual('fullIdentifier').get(function() {
  return `${this.type}:${this.identifier}`;
});

// Method to check if content is visible to user
contentSchema.methods.isVisibleToUser = function(userType = 'public') {
  if (!this.visibility.isActive) return false;
  
  // Check date range
  const now = new Date();
  if (this.visibility.startDate && now < this.visibility.startDate) return false;
  if (this.visibility.endDate && now > this.visibility.endDate) return false;
  
  // Check user type permissions
  if (this.visibility.userTypes.length > 0) {
    if (!this.visibility.userTypes.includes(userType) && !this.visibility.userTypes.includes('all')) {
      return false;
    }
  }
  
  // Check view permissions
  if (this.permissions.canView.length > 0) {
    return this.permissions.canView.includes(userType) || this.permissions.canView.includes('public');
  }
  
  return this.visibility.isPublic;
};

// Method to check if user can edit content
contentSchema.methods.canUserEdit = function(userType) {
  return this.permissions.canEdit.includes(userType);
};

// Method to increment view count
contentSchema.methods.incrementView = function() {
  this.analytics.views += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

// Method to get localized content
contentSchema.methods.getLocalizedContent = function(language = 'en') {
  if (language === 'en' || !this.localization.translations) {
    return {
      title: this.title,
      content: this.content
    };
  }
  
  const translation = this.localization.translations.find(t => t.language === language);
  if (translation) {
    return {
      title: translation.title || this.title,
      content: translation.content || this.content
    };
  }
  
  return {
    title: this.title,
    content: this.content
  };
};

// Static method to get content by type
contentSchema.statics.getByType = function(type, userType = 'public') {
  return this.find({ 
    type, 
    'visibility.isActive': true 
  }).then(contents => {
    return contents.filter(content => content.isVisibleToUser(userType));
  });
};

// Static method to get content by identifier
contentSchema.statics.getByIdentifier = function(identifier, userType = 'public') {
  return this.findOne({ identifier }).then(content => {
    if (!content || !content.isVisibleToUser(userType)) {
      return null;
    }
    return content;
  });
};

// Pre-save middleware to update version
contentSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('title')) {
    this.metadata.version += 1;
  }
  next();
});

module.exports = mongoose.model('Content', contentSchema); 