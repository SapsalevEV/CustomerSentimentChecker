#!/bin/bash

# deploy-database.sh - Deploy database file to staging or production server
#
# Usage:
#   ./scripts/deploy-database.sh staging
#   ./scripts/deploy-database.sh production
#
# This script copies the local database file to the remote server.
# It must be run from the project root directory.

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_msg() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Check if environment parameter is provided
if [ -z "$1" ]; then
    print_msg "$RED" "❌ ERROR: Environment parameter required!"
    echo ""
    echo "Usage:"
    echo "  ./scripts/deploy-database.sh staging"
    echo "  ./scripts/deploy-database.sh production"
    exit 1
fi

ENVIRONMENT=$1

# Configuration based on environment
if [ "$ENVIRONMENT" == "staging" ]; then
    SERVER_HOST="89.23.99.74"
    SERVER_USER="deploy"
    SERVER_PATH="/home/deploy/actionable-sentiment-backend"
    print_msg "$BLUE" "🧪 Deploying to STAGING environment"
elif [ "$ENVIRONMENT" == "production" ]; then
    SERVER_HOST="193.233.102.193"
    SERVER_USER="deploy"
    SERVER_PATH="/home/deploy/actionable-sentiment-backend"
    print_msg "$BLUE" "🚀 Deploying to PRODUCTION environment"
else
    print_msg "$RED" "❌ ERROR: Invalid environment: $ENVIRONMENT"
    echo "Valid options: staging, production"
    exit 1
fi

# Check if database file exists locally
LOCAL_DB="database/bank_reviews.db"
if [ ! -f "$LOCAL_DB" ]; then
    print_msg "$RED" "❌ ERROR: Database file not found: $LOCAL_DB"
    echo ""
    echo "Make sure you're running this script from the project root directory."
    exit 1
fi

# Display database file info
DB_SIZE=$(du -h "$LOCAL_DB" | cut -f1)
print_msg "$GREEN" "✅ Found local database file: $LOCAL_DB ($DB_SIZE)"

# Confirm deployment
echo ""
print_msg "$YELLOW" "⚠️  WARNING: This will overwrite the database on $ENVIRONMENT server!"
print_msg "$YELLOW" "Server: $SERVER_HOST"
print_msg "$YELLOW" "Path: $SERVER_PATH/database/"
echo ""
read -p "Do you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_msg "$YELLOW" "❌ Deployment cancelled"
    exit 0
fi

echo ""
print_msg "$BLUE" "========================================="
print_msg "$BLUE" "Starting database deployment"
print_msg "$BLUE" "========================================="
echo ""

# Step 1: Create backup of existing database on server
print_msg "$BLUE" "📦 Step 1/4: Creating backup of existing database on server..."
ssh "$SERVER_USER@$SERVER_HOST" "
    cd $SERVER_PATH
    if [ -f database/bank_reviews.db ]; then
        BACKUP_NAME=\"bank_reviews.db.backup-\$(date +%Y%m%d-%H%M%S)\"
        cp database/bank_reviews.db database/\$BACKUP_NAME
        echo \"✅ Backup created: database/\$BACKUP_NAME\"
        echo \"📊 Current database size: \$(du -h database/bank_reviews.db | cut -f1)\"
    else
        echo \"⚠️  No existing database found - this is a fresh deployment\"
    fi
" || {
    print_msg "$RED" "❌ Failed to create backup!"
    print_msg "$YELLOW" "Continue anyway? (yes/no): "
    read CONTINUE_ANYWAY
    if [ "$CONTINUE_ANYWAY" != "yes" ]; then
        exit 1
    fi
}

# Step 2: Stop containers
print_msg "$BLUE" "🛑 Step 2/4: Stopping application containers..."
if [ "$ENVIRONMENT" == "staging" ]; then
    COMPOSE_FILE="docker-compose.staging.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

ssh "$SERVER_USER@$SERVER_HOST" "
    cd $SERVER_PATH
    docker compose -f $COMPOSE_FILE down || true
    echo \"✅ Containers stopped\"
"

# Step 3: Copy database file
print_msg "$BLUE" "📤 Step 3/4: Copying database file to server..."
scp "$LOCAL_DB" "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/database/bank_reviews.db" || {
    print_msg "$RED" "❌ Failed to copy database file!"
    exit 1
}
print_msg "$GREEN" "✅ Database file copied successfully"

# Step 4: Set permissions and restart
print_msg "$BLUE" "🔐 Step 4/4: Setting permissions and restarting containers..."
ssh "$SERVER_USER@$SERVER_HOST" "
    cd $SERVER_PATH

    # Set correct permissions for SQLite WAL mode
    chmod -R 777 database/
    echo \"✅ Permissions set\"

    # Restart containers
    echo \"🚀 Starting containers...\"
    docker compose -f $COMPOSE_FILE up -d

    echo \"⏳ Waiting for application to start...\"
    sleep 10

    # Health check
    echo \"🏥 Running health check...\"
    for i in {1..6}; do
        if curl -f http://localhost:8000/health 2>/dev/null; then
            echo \"✅ Application is healthy!\"
            break
        else
            if [ \$i -eq 6 ]; then
                echo \"⚠️  WARNING: Health check failed after 6 attempts\"
                echo \"📋 Container logs:\"
                docker compose -f $COMPOSE_FILE logs --tail=30 api
            else
                echo \"⏳ Attempt \$i/6...\"
                sleep 5
            fi
        fi
    done

    # Database health check
    echo \"\"
    echo \"🔍 Checking database health...\"
    if curl -f http://localhost:8000/health/database 2>/dev/null | grep -q '\"healthy\":true'; then
        echo \"✅ Database health check passed!\"
    else
        echo \"⚠️  WARNING: Database health check failed\"
        echo \"Response:\"
        curl -s http://localhost:8000/health/database 2>/dev/null || echo \"Could not fetch database health\"
    fi

    echo \"\"
    echo \"📊 New database info:\"
    ls -lh database/bank_reviews.db
"

echo ""
print_msg "$GREEN" "========================================="
print_msg "$GREEN" "✅ Database deployment completed!"
print_msg "$GREEN" "========================================="
echo ""
print_msg "$BLUE" "🌐 Verify deployment:"
print_msg "$BLUE" "   Health: http://$SERVER_HOST:8000/health"
print_msg "$BLUE" "   DB Health: http://$SERVER_HOST:8000/health/database"
print_msg "$BLUE" "   API Docs: http://$SERVER_HOST:8000/docs"
echo ""
print_msg "$YELLOW" "💡 TIP: Test the /api/dashboard/overview endpoint to ensure it works correctly"
