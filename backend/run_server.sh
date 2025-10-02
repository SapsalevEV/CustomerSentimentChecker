#!/bin/bash

# Backend startup script for Ubuntu
# Usage:
#   ./run_server.sh           - Production mode (72.56.64.34:8000)
#   ./run_server.sh --dev     - Development mode with auto-reload

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found!${NC}"
    echo "Creating .env from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}.env file created. Please review and update if needed.${NC}"
    else
        echo -e "${RED}Error: .env.example not found!${NC}"
        exit 1
    fi
fi

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo -e "${YELLOW}Virtual environment not activated!${NC}"

    # Try to find and activate venv
    if [ -d "venv" ]; then
        echo "Activating venv..."
        source venv/bin/activate
    elif [ -d ".venv" ]; then
        echo "Activating .venv..."
        source .venv/bin/activate
    else
        echo -e "${RED}Error: No virtual environment found (venv or .venv)${NC}"
        echo "Please create one with: python3 -m venv venv"
        exit 1
    fi
fi

# Check if dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}Dependencies not installed!${NC}"
    echo "Installing requirements..."
    pip install -r requirements.txt
fi

# Check database exists
if [ ! -f "database/bank_reviews.db" ]; then
    echo -e "${YELLOW}Warning: Database not found at database/bank_reviews.db${NC}"
    echo "Make sure to run migrations or place the database file in the correct location."
fi

echo -e "${GREEN}Starting Actionable Sentiment Backend...${NC}"
echo ""

# Parse command line arguments
if [ "$1" = "--dev" ] || [ "$1" = "-d" ]; then
    # Development mode with auto-reload
    echo -e "${YELLOW}Mode: Development (with auto-reload)${NC}"
    echo "Host: 0.0.0.0:8000"
    echo "API Docs: http://localhost:8000/docs"
    echo ""
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
else
    # Production mode on specific IP
    echo -e "${GREEN}Mode: Production${NC}"
    echo "Host: 72.56.64.34:8000"
    echo "API Docs: http://72.56.64.34:8000/docs"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    echo ""
    uvicorn app.main:app --host 72.56.64.34 --port 8000
fi
