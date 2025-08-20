# 🚀 Deployment Guide for University Recruitment Platform

This guide will help you deploy your university recruitment platform to production using Netlify (frontend) and Render (backend).

## 📋 Prerequisites

- Git repository with your code
- MongoDB Atlas account (for database)
- Environment variables configured
- Domain name (optional but recommended)

## 🎯 Recommended Deployment Strategy

### Frontend: Netlify
### Backend: Render
### Database: MongoDB Atlas
### ML Services: Render (separate service)

## 🚀 Step-by-Step Deployment

### 1. Frontend Deployment (Netlify)

#### Option A: Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to frontend directory
cd frontend

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

#### Option B: Deploy via GitHub Integration
1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Connect your GitHub repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: `frontend`

### 2. Backend Deployment (Render)

#### Option A: Deploy via Render Dashboard
1. Go to [render.com](https://render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: `university-recruitment-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free

#### Option B: Deploy via render.yaml (Recommended)
1. Push your code with `render.yaml` to GitHub
2. Go to [render.com](https://render.com)
3. Click "New +" and select "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect and deploy both services

### 3. ML Services Deployment (Render)

#### Option A: Manual Deployment
1. Go to [render.com](https://render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: `university-recruitment-ml-service`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn standardized_app:app -b 0.0.0.0:$PORT`
   - Plan: Free

#### Option B: Via render.yaml (Automatic)
The `render.yaml` file will automatically deploy both services.

### 4. Database Setup (MongoDB Atlas)

1. Create account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create new cluster
3. Create database user
4. Get connection string
5. Add to environment variables

### 5. Environment Variables Setup

#### Frontend (Netlify)
```bash
# Set in Netlify dashboard or via CLI
netlify env:set REACT_APP_API_URL https://your-backend-url.onrender.com
```

#### Backend (Render)
Set in Render dashboard:
```
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret
FRONTEND_URL=https://your-frontend-url.netlify.app
ML_SERVICE_URL=https://your-ml-service-url.onrender.com
```

## 🔧 Configuration Updates

### Update API Base URL
Update `frontend/src/utils/api.ts`:
```typescript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  // ... rest of config
});
```

### Update CORS Settings
Update `backend/server.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

## 🌐 Custom Domain Setup

### Frontend (Netlify)
1. Go to Netlify dashboard
2. Select your site
3. Go to Domain management
4. Add custom domain
5. Configure DNS records

### Backend (Render)
1. Go to Render dashboard
2. Select your service
3. Go to Settings > Custom Domains
4. Add custom domain
5. Configure DNS records

## 🔍 Health Checks

### Frontend Health Check
```bash
curl https://your-frontend-domain.netlify.app
```

### Backend Health Check
```bash
curl https://your-backend-domain.onrender.com/api/health
```

### ML Service Health Check
```bash
curl https://your-ml-service-domain.onrender.com/health
```

## 📊 Monitoring & Logs

### Netlify Analytics
- Built-in analytics in Netlify dashboard
- Performance monitoring
- Error tracking
- Form submissions

### Render Monitoring
- Real-time logs in Render dashboard
- Performance metrics
- Error tracking
- Auto-scaling

### MongoDB Atlas
- Database performance monitoring
- Query optimization
- Backup management

## 🔒 Security Checklist

- [ ] Environment variables properly set
- [ ] CORS configured correctly
- [ ] JWT secrets are secure
- [ ] Database connection is secure
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] Error handling in place

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check FRONTEND_URL environment variable
   - Verify CORS configuration in backend

2. **Database Connection Issues**
   - Verify MONGODB_URI format
   - Check network access in MongoDB Atlas

3. **Build Failures**
   - Check package.json dependencies
   - Verify build commands
   - Check for TypeScript errors

4. **ML Service Not Responding**
   - Verify ML service URL
   - Check Python dependencies
   - Verify model files are included

### Debug Commands
```bash
# Check backend logs
# View in Render dashboard

# Check frontend build
netlify logs

# Test API endpoints
curl -X GET https://your-backend-url.onrender.com/api/health
```

## 📈 Scaling Considerations

### Frontend
- Netlify automatically scales
- CDN distribution worldwide
- Edge functions for API routes

### Backend
- Render auto-scaling available
- Load balancing
- Horizontal scaling options

### Database
- MongoDB Atlas auto-scaling
- Read replicas for performance
- Sharding for large datasets

## 💰 Cost Optimization

### Free Tier Limits
- Netlify: 100GB bandwidth/month, 300 build minutes
- Render: 750 hours/month (free tier)
- MongoDB Atlas: 512MB storage

### Paid Plans
- Netlify Pro: $19/month
- Render: Pay-as-you-go
- MongoDB Atlas: Starting $9/month

## 🎉 Deployment Complete!

Once deployed, your application will be available at:
- Frontend: `https://your-app.netlify.app`
- Backend: `https://your-app.onrender.com`
- ML Service: `https://your-ml-service.onrender.com`

Remember to:
1. Test all functionality
2. Monitor performance
3. Set up alerts
4. Configure backups
5. Document any custom configurations
