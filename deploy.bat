@echo off
REM 🚀 University Recruitment Platform Deployment Script for Windows
REM This script helps automate the deployment process for Netlify + Render

echo 🚀 Starting deployment process...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm
    pause
    exit /b 1
)

echo [SUCCESS] All dependencies are installed

REM Build frontend
echo [INFO] Building frontend...
cd frontend

echo [INFO] Installing frontend dependencies...
call npm install

echo [INFO] Building frontend application...
call npm run build

cd ..
echo [SUCCESS] Frontend built successfully

REM Deploy frontend to Netlify
echo [INFO] Deploying frontend to Netlify...
cd frontend

REM Check if Netlify CLI is installed
netlify --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Netlify CLI not found. Installing...
    call npm install -g netlify-cli
)

REM Login to Netlify (if not already logged in)
echo [INFO] Checking Netlify login status...
netlify status >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Please login to Netlify...
    call netlify login
)

REM Deploy to Netlify
echo [INFO] Running Netlify deployment...
call netlify deploy --prod --dir=dist

cd ..
echo [SUCCESS] Frontend deployed to Netlify

REM Deploy backend to Render
echo [INFO] Deploying backend to Render...
echo [INFO] Please follow these steps to deploy to Render:
echo.
echo 1. Go to https://render.com
echo 2. Click "New +" and select "Blueprint"
echo 3. Connect your GitHub repository
echo 4. Render will automatically deploy both services using render.yaml
echo.
echo OR manually deploy:
echo 1. Go to https://render.com
echo 2. Click "New +" and select "Web Service"
echo 3. Connect your GitHub repository
echo 4. Configure:
echo    - Name: university-recruitment-backend
echo    - Environment: Node
echo    - Build Command: npm install
echo    - Start Command: npm start
echo    - Plan: Free
echo.

REM Setup environment variables
echo [INFO] Setting up environment variables...
echo.
echo Please provide the following information:
echo.

set /p FRONTEND_URL="Frontend URL (from Netlify): "
set /p BACKEND_URL="Backend URL (from Render): "
set /p MONGODB_URI="MongoDB Atlas Connection String: "
set /p JWT_SECRET="JWT Secret: "

REM Set Netlify environment variables
echo [INFO] Setting Netlify environment variables...
cd frontend
call netlify env:set REACT_APP_API_URL "%BACKEND_URL%"
cd ..

echo [SUCCESS] Environment variables configured

echo.
echo 🎉 Deployment completed successfully!
echo.
echo Next steps:
echo 1. Set environment variables in Render dashboard:
echo    - NODE_ENV=production
echo    - MONGODB_URI=%MONGODB_URI%
echo    - JWT_SECRET=%JWT_SECRET%
echo    - FRONTEND_URL=%FRONTEND_URL%
echo 2. Test your application
echo 3. Configure custom domains (optional)
echo 4. Set up monitoring and alerts
echo 5. Configure backups
echo.
echo For detailed instructions, see DEPLOYMENT.md
pause
