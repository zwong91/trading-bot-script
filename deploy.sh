#!/bin/bash

# DEX Platform Deployment Script
# This script helps deploy the complete DEX platform

echo "🚀 DEX Platform Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the trading_bot-script root directory"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version check passed: $(node -v)"

# Install backend dependencies
print_info "Installing backend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_status "Backend dependencies installed successfully"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
print_info "Installing frontend dependencies..."
cd dex-frontend
npm install
if [ $? -eq 0 ]; then
    print_status "Frontend dependencies installed successfully"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Check for environment files
cd ..
if [ ! -f ".env" ]; then
    print_warning "Backend .env file not found. Creating template..."
    cat > .env << EOL
# Backend Environment Variables
WALLET_ADDRESS=your_wallet_address_here
PRIVATE_KEY=your_private_key_here
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
PORT=3001
EOL
    print_info "Please edit .env file with your actual values"
fi

cd dex-frontend
if [ ! -f ".env.local" ]; then
    print_warning "Frontend .env.local file not found. Creating template..."
    cat > .env.local << EOL
# Frontend Environment Variables
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_API_URL=http://localhost:3000/api
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_CHAIN_ID=97
EOL
    print_info "Please edit .env.local file with your actual values"
fi

# Build frontend for production
print_info "Building frontend for production..."
npm run build
if [ $? -eq 0 ]; then
    print_status "Frontend build completed successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

# Run tests
cd ..
print_info "Running backend tests..."
if [ -f "src/test-swap-any-tokens.ts" ]; then
    print_info "Testing swap functionality..."
    # npx ts-node src/test-swap-any-tokens.ts
    print_status "Swap tests are available (run manually to avoid using real funds)"
fi

if [ -f "src/test-add-liquidity.ts" ]; then
    print_info "Testing liquidity functionality..."
    # npx ts-node src/test-add-liquidity.ts
    print_status "Liquidity tests are available (run manually to avoid using real funds)"
fi

# Success message
echo ""
echo "=================================="
print_status "DEX Platform deployment completed successfully!"
echo ""
print_info "Next steps:"
echo "1. Edit environment files with your actual values:"
echo "   - .env (backend configuration)"
echo "   - dex-frontend/.env.local (frontend configuration)"
echo ""
echo "2. Start the backend server:"
echo "   node api/index.js"
echo ""
echo "3. Start the frontend development server:"
echo "   cd dex-frontend && npm run dev"
echo ""
echo "4. Access the platform at http://localhost:3000"
echo ""
print_info "For production deployment:"
echo "- Backend: Deploy to Railway, Heroku, or your preferred platform"
echo "- Frontend: Deploy to Vercel, Netlify, or your preferred platform"
echo ""
print_warning "Remember to:"
echo "- Keep your private keys secure"
echo "- Use testnet for testing"
echo "- Never commit sensitive information to version control"
echo "=================================="
