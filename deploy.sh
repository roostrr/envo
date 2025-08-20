#!/bin/bash

# 🚀 University Recruitment Platform Deployment Script
# This script helps automate the deployment process for Netlify + Render

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed. Please install git"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build the application
    print_status "Building frontend application..."
    npm run build
    
    cd ..
    print_success "Frontend built successfully"
}

# Deploy frontend to Netlify
deploy_frontend() {
    print_status "Deploying frontend to Netlify..."
    
    cd frontend
    
    # Check if Netlify CLI is installed
    if ! command -v netlify &> /dev/null; then
        print_warning "Netlify CLI not found. Installing..."
        npm install -g netlify-cli
    fi
    
    # Login to Netlify (if not already logged in)
    print_status "Checking Netlify login status..."
    if ! netlify status &> /dev/null; then
        print_warning "Please login to Netlify..."
        netlify login
    fi
    
    # Deploy to Netlify
    print_status "Running Netlify deployment..."
    netlify deploy --prod --dir=dist
    
    cd ..
    print_success "Frontend deployed to Netlify"
}

# Deploy backend to Render
deploy_backend() {
    print_status "Deploying backend to Render..."
    
    print_status "Please follow these steps to deploy to Render:"
    echo ""
    echo "1. Go to https://render.com"
    echo "2. Click 'New +' and select 'Blueprint'"
    echo "3. Connect your GitHub repository"
    echo "4. Render will automatically deploy both services using render.yaml"
    echo ""
    echo "OR manually deploy:"
    echo "1. Go to https://render.com"
    echo "2. Click 'New +' and select 'Web Service'"
    echo "3. Connect your GitHub repository"
    echo "4. Configure:"
    echo "   - Name: university-recruitment-backend"
    echo "   - Environment: Node"
    echo "   - Build Command: npm install"
    echo "   - Start Command: npm start"
    echo "   - Plan: Free"
    echo ""
    
    read -p "Press Enter when you've completed the Render deployment..."
    print_success "Backend deployment instructions provided"
}

# Setup environment variables
setup_env_vars() {
    print_status "Setting up environment variables..."
    
    echo ""
    echo "Please provide the following information:"
    echo ""
    
    read -p "Frontend URL (from Netlify): " FRONTEND_URL
    read -p "Backend URL (from Render): " BACKEND_URL
    read -p "MongoDB Atlas Connection String: " MONGODB_URI
    read -s -p "JWT Secret (will be hidden): " JWT_SECRET
    echo ""
    
    # Set Netlify environment variables
    print_status "Setting Netlify environment variables..."
    cd frontend
    netlify env:set REACT_APP_API_URL "$BACKEND_URL"
    cd ..
    
    print_success "Environment variables configured"
    
    echo ""
    echo "Next steps for Render environment variables:"
    echo "1. Go to your Render dashboard"
    echo "2. Select your backend service"
    echo "3. Go to Environment tab"
    echo "4. Add these variables:"
    echo "   - NODE_ENV=production"
    echo "   - MONGODB_URI=$MONGODB_URI"
    echo "   - JWT_SECRET=$JWT_SECRET"
    echo "   - FRONTEND_URL=$FRONTEND_URL"
    echo ""
}

# Main deployment function
main() {
    echo "🎯 University Recruitment Platform Deployment (Netlify + Render)"
    echo "============================================================="
    echo ""
    
    # Check dependencies
    check_dependencies
    
    # Build frontend
    build_frontend
    
    # Deploy frontend
    deploy_frontend
    
    # Deploy backend
    deploy_backend
    
    # Setup environment variables
    setup_env_vars
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Set environment variables in Render dashboard"
    echo "2. Test your application"
    echo "3. Configure custom domains (optional)"
    echo "4. Set up monitoring and alerts"
    echo "5. Configure backups"
    echo ""
    echo "For detailed instructions, see DEPLOYMENT.md"
}

# Run main function
main "$@"
