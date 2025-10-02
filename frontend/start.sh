#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Actionable Sentiment Startup Script ===${NC}\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"
echo -e "${GREEN}✓ npm version: $(npm -v)${NC}\n"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo "Creating .env from template..."

    cat > .env << 'EOF'
# Backend API
VITE_API_BASE_URL="http://72.56.64.34:8000"

EOF

    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}Please update .env with your configuration if needed${NC}\n"
else
    echo -e "${GREEN}✓ .env file found${NC}\n"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install

    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to install dependencies${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Dependencies installed${NC}\n"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}\n"
fi

# Check backend API connectivity
echo -e "${YELLOW}Checking backend API connectivity...${NC}"
if curl -s --connect-timeout 5 http://72.56.64.34:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is reachable${NC}\n"
else
    echo -e "${YELLOW}Warning: Cannot reach backend API at http://72.56.64.34:8000${NC}"
    echo -e "${YELLOW}The app will use mock data${NC}\n"
fi

# Start the development server
echo -e "${GREEN}Starting development server on port 8080...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"

npm run dev
