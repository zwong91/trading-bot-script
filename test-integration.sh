#!/bin/bash

# DEX Platform Integration Test Script
echo "🧪 Testing DEX Platform Integration"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test backend health
echo -e "${BLUE}📡 Testing Backend Health...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:5000/health)
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
    echo "   Network: $(echo $HEALTH_RESPONSE | grep -o '"network":"[^"]*"' | cut -d'"' -f4)"
    echo "   Status: $(echo $HEALTH_RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

echo ""

# Test wallet data
echo -e "${BLUE}💰 Testing Wallet Data...${NC}"
WALLETS_RESPONSE=$(curl -s http://localhost:5000/wallets)
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Wallet data retrieved successfully${NC}"
    echo "   Total BNB: $(echo $WALLETS_RESPONSE | grep -o '"totalBnb":"[^"]*"' | cut -d'"' -f4)"
    echo "   Total USDC: $(echo $WALLETS_RESPONSE | grep -o '"totalUsdc":"[^"]*"' | cut -d'"' -f4)"
    echo "   Total USDT: $(echo $WALLETS_RESPONSE | grep -o '"totalUsdt":"[^"]*"' | cut -d'"' -f4)"
else
    echo -e "${RED}❌ Wallet data retrieval failed${NC}"
fi

echo ""

# Test frontend accessibility
echo -e "${BLUE}🌐 Testing Frontend Pages...${NC}"

# Test homepage
HOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [[ $HOME_STATUS -eq 200 ]]; then
    echo -e "${GREEN}✅ Homepage accessible (200)${NC}"
else
    echo -e "${RED}❌ Homepage not accessible ($HOME_STATUS)${NC}"
fi

# Test swap page
SWAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/swap)
if [[ $SWAP_STATUS -eq 200 ]]; then
    echo -e "${GREEN}✅ Swap page accessible (200)${NC}"
else
    echo -e "${RED}❌ Swap page not accessible ($SWAP_STATUS)${NC}"
fi

# Test liquidity page
LIQUIDITY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/liquidity)
if [[ $LIQUIDITY_STATUS -eq 200 ]]; then
    echo -e "${GREEN}✅ Liquidity page accessible (200)${NC}"
else
    echo -e "${RED}❌ Liquidity page not accessible ($LIQUIDITY_STATUS)${NC}"
fi

# Test dashboard page
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard)
if [[ $DASHBOARD_STATUS -eq 200 ]]; then
    echo -e "${GREEN}✅ Dashboard page accessible (200)${NC}"
else
    echo -e "${RED}❌ Dashboard page not accessible ($DASHBOARD_STATUS)${NC}"
fi

echo ""

# Test API routes
echo -e "${BLUE}🔌 Testing Frontend API Routes...${NC}"

# Test portfolio API
PORTFOLIO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/portfolio?walletAddress=0xE0A051f87bb78f38172F633449121475a193fC1A")
if [[ $PORTFOLIO_STATUS -eq 200 ]]; then
    echo -e "${GREEN}✅ Portfolio API accessible (200)${NC}"
else
    echo -e "${RED}❌ Portfolio API not accessible ($PORTFOLIO_STATUS)${NC}"
fi

echo ""
echo "===================================="
echo -e "${GREEN}🎉 DEX Platform Integration Test Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Quick Access URLs:${NC}"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   Swap:     http://localhost:3000/swap"
echo "   Liquidity: http://localhost:3000/liquidity"
echo "   Dashboard: http://localhost:3000/dashboard"
echo ""
echo -e "${BLUE}💡 Ready to trade! Connect MetaMask to BSC Testnet and start using your DEX!${NC}"
