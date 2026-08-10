#!/bin/bash
# UniService Automated Deployment Script (Runs every 30 minutes via Cron)

APP_DIR="/home/ubuntu/ui_uniservice"
LOG_FILE="$APP_DIR/deploy.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Checking for updates from GitHub..." >> "$LOG_FILE"

cd "$APP_DIR" || exit 1

# Fetch latest commits from master branch
git fetch origin master

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/master)

# Check if new commits exist or force deployment flag
if [ "$LOCAL_HASH" != "$REMOTE_HASH" ] || [ "$1" == "--force" ] || [ ! -f "$APP_DIR/backend/target/backend-1.0.0.jar" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deploying latest UniService release..." >> "$LOG_FILE"
    
    # Pull latest code
    git checkout master
    git pull origin master
    
    # Build frontend
    cd "$APP_DIR/frontend" || exit 1
    npm install
    npm run build
    
    # Copy frontend build into backend static resources
    mkdir -p "$APP_DIR/backend/src/main/resources/static"
    rm -rf "$APP_DIR/backend/src/main/resources/static/"*
    cp -r "$APP_DIR/frontend/dist/"* "$APP_DIR/backend/src/main/resources/static/"
    
    # Rebuild backend
    cd "$APP_DIR/backend" || exit 1
    mvn clean package -DskipTests
    
    # Stop existing backend process if running
    PID=$(pgrep -f "backend-1.0.0.jar")
    if [ -n "$PID" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stopping existing process (PID: $PID)..." >> "$LOG_FILE"
        kill -9 "$PID"
        sleep 2
    fi
    
    # Start updated server on port 8083
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting updated UniService application on Port 8083..." >> "$LOG_FILE"
    nohup java -jar target/backend-1.0.0.jar > backend.log 2>&1 &
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deployment completed successfully!" >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] No new updates. System is up to date." >> "$LOG_FILE"
fi
