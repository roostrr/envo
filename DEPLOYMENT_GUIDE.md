# Deployment Guide for University Recruitment Platform

This guide provides step-by-step instructions for deploying the backend services to Render.

## Overview

The application consists of two main services:
1. **Node.js Backend** - Main API server with authentication, user management, and business logic
2. **Python ML Service** - Machine learning service for student recruitment predictions

## Prerequisites

- Render account
- Git repository with the code
- Environment variables configured

## Environment Variables

### Backend Service (Node.js)
- `NODE_ENV` = production
- `MONGODB_URI` = Your MongoDB connection string
- `JWT_SECRET` = Secret key for JWT tokens
- `FRONTEND_URL` = URL of your frontend application

### ML Service (Python)
- `FLASK_ENV` = production
- `PORT` = 5004 (automatically set by Render)

## Deployment Steps

### 1. Connect Repository to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" and select "Web Service"
3. Connect your Git repository
4. Configure the services as described below

### 2. Deploy Backend Service

**Service Configuration:**
- **Name**: `university-recruitment-backend`
- **Environment**: Node
- **Plan**: Free
- **Root Directory**: `backend`
- **Build Command**: 
  ```
  npm install
  node test_node_startup.js
  ```
- **Start Command**: `node start_node_service.js`
- **Health Check Path**: `/api/health`

**Environment Variables:**
- `NODE_ENV` = production
- `MONGODB_URI` = [Your MongoDB URI]
- `JWT_SECRET` = [Your JWT Secret]
- `FRONTEND_URL` = [Your Frontend URL]

### 3. Deploy ML Service

**Service Configuration:**
- **Name**: `university-recruitment-ml-service`
- **Environment**: Python
- **Plan**: Free
- **Root Directory**: `backend`
- **Build Command**: 
  ```
  pip install -r requirements.txt
  python verify_deployment.py
  ```
- **Start Command**: `python start_ml_service.py`
- **Health Check Path**: `/health`

**Environment Variables:**
- `FLASK_ENV` = production
- `PORT` = 5004

### 4. Verify Deployment

After deployment, verify that both services are running:

1. **Check Backend Health**: Visit `https://your-backend-service.onrender.com/api/health`
2. **Check ML Service Health**: Visit `https://your-ml-service.onrender.com/health`

Both should return a JSON response with status "OK".

## Troubleshooting

### Common Issues

1. **Health Check Failures**
   - Ensure the `/health` endpoints are properly configured
   - Check that the services are starting correctly

2. **Import Errors**
   - Verify all dependencies are listed in `requirements.txt`
   - Check that the Python version is compatible (3.12)

3. **Port Issues**
   - Ensure the services are using the PORT environment variable
   - Check that the health check paths match the configuration

4. **Database Connection**
   - Verify the MongoDB URI is correct
   - Ensure the database is accessible from Render

### Debugging

1. **Check Build Logs**: Review the build logs in Render dashboard
2. **Check Runtime Logs**: Monitor the runtime logs for errors
3. **Use Health Check Script**: Run the health check script locally to test services

## Health Check Script

Use the provided health check script to verify services:

```bash
cd backend
python health_check.py
```

## File Structure

```
backend/
├── server.js                 # Node.js main server
├── standardized_app.py       # Flask ML service
├── start_node_service.js     # Node.js startup script
├── start_ml_service.py       # Python startup script
├── verify_deployment.py      # Deployment verification
├── health_check.py          # Health check script
├── requirements.txt         # Python dependencies
├── package.json            # Node.js dependencies
└── render.yaml             # Render configuration
```

## Support

If you encounter issues:
1. Check the deployment logs in Render dashboard
2. Verify all environment variables are set correctly
3. Ensure all required files are present in the repository
4. Test the services locally before deploying

## Notes

- The free tier of Render has limitations on build time and runtime
- Services may take a few minutes to start up initially
- Health checks are performed every 10 seconds by Render
- Services will be restarted automatically if they fail health checks
