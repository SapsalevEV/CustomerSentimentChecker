# Database Setup and Deployment Guide

This guide covers everything you need to know about deploying and managing the SQLite database for the Actionable Sentiment Backend.

## Table of Contents

1. [Overview](#overview)
2. [Initial Setup](#initial-setup)
3. [Deploying to Staging](#deploying-to-staging)
4. [Deploying to Production](#deploying-to-production)
5. [Database Health Checks](#database-health-checks)
6. [Backup and Restore](#backup-and-restore)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

## Overview

### Why Database is Separate

The database file (`bank_reviews.db`) is intentionally excluded from Docker images because:

1. **Data Persistence**: Database must survive container restarts and updates
2. **Size**: Database files can be large and shouldn't be in version control
3. **Security**: Database may contain sensitive data
4. **Flexibility**: Allows easy backup/restore and data updates

### Database File Location

- **Local Development**: `./database/bank_reviews.db`
- **Staging Server**: `/home/deploy/actionable-sentiment-backend/database/bank_reviews.db`
- **Production Server**: `/home/deploy/actionable-sentiment-backend/database/bank_reviews.db`

### Database Structure

The database contains:
- **reviews** table: 1321 client reviews
- **annotations** table: 3568 sentiment annotations
- **categories** table: ~30 product categories
- **sentiments** table: 3 sentiment types (позитив, негатив, нейтральный)
- **sources** table: 2 sources (Banki.ru, Sravni.ru)

## Initial Setup

### Prerequisites

Before deploying the database, ensure:

1. ✅ SSH access to target server (staging or production)
2. ✅ SSH keys configured for passwordless login
3. ✅ Database file exists locally (`database/bank_reviews.db`)
4. ✅ Application directory exists on server (`/home/deploy/actionable-sentiment-backend`)

### Verify Local Database

Check your local database file:

```bash
# Check file exists
ls -lh database/bank_reviews.db

# Check database integrity (optional)
sqlite3 database/bank_reviews.db "PRAGMA integrity_check;"
```

Expected output: `ok`

## Deploying to Staging

### Automated Deployment (Recommended)

Use the deployment script:

```bash
./scripts/deploy-database.sh staging
```

The script will:
1. ✅ Verify local database exists
2. ✅ Create backup of existing database on server
3. ✅ Stop application containers
4. ✅ Upload database file via SCP
5. ✅ Set correct permissions (777 for WAL mode)
6. ✅ Restart containers
7. ✅ Run health checks

### Manual Deployment

If you prefer manual deployment:

```bash
# 1. Copy database to staging server
scp database/bank_reviews.db deploy@89.23.99.74:/home/deploy/actionable-sentiment-backend/database/

# 2. SSH to server
ssh deploy@89.23.99.74

# 3. Set permissions
cd /home/deploy/actionable-sentiment-backend
chmod 777 database/bank_reviews.db

# 4. Restart containers
docker compose -f docker-compose.staging.yml restart

# 5. Verify health
curl http://localhost:8000/health/database
```

### Verify Deployment

After deployment, check:

```bash
# Basic health check
curl http://89.23.99.74:8000/health

# Database health check
curl http://89.23.99.74:8000/health/database

# Test dashboard endpoint
curl -X POST http://89.23.99.74:8000/api/dashboard/overview \
  -H "Content-Type: application/json" \
  -d '{
    "date_range": {
      "from": "2023-01-01T00:00:00Z",
      "to": "2023-12-31T23:59:59Z"
    },
    "filters": {}
  }'
```

## Deploying to Production

### Pre-deployment Checklist

Before deploying to production:

- [ ] Database tested on staging environment
- [ ] Backup of current production database created
- [ ] Application containers can be stopped briefly
- [ ] Deployment window scheduled (if needed)

### Automated Deployment

```bash
./scripts/deploy-database.sh production
```

### Manual Deployment

```bash
# 1. Copy database to production server
scp database/bank_reviews.db deploy@193.233.102.193:/home/deploy/actionable-sentiment-backend/database/

# 2. SSH to server
ssh deploy@193.233.102.193

# 3. Set permissions
cd /home/deploy/actionable-sentiment-backend
chmod 777 database/bank_reviews.db

# 4. Restart containers
docker compose restart

# 5. Verify health
curl http://localhost:8000/health/database
```

### Post-deployment Verification

```bash
# Application health
curl http://193.233.102.193:8000/health

# Database health
curl http://193.233.102.193:8000/health/database

# Check logs
ssh deploy@193.233.102.193
cd /home/deploy/actionable-sentiment-backend
docker compose logs -f --tail=100
```

## Database Health Checks

### Health Check Endpoints

#### Basic Health: `/health`

Returns application status:

```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

#### Database Health: `/health/database`

Returns detailed database status:

```json
{
  "healthy": true,
  "tables": {
    "exist": true,
    "missing": []
  },
  "views": ["category_statistics", "reviews_timeline"],
  "row_counts": {
    "reviews": 1321,
    "annotations": 3568,
    "categories": 30,
    "sentiments": 3,
    "sources": 2
  },
  "statistics": {
    "total_reviews": 1321,
    "total_annotations": 3568,
    "date_range": {
      "earliest": "2023-01-01",
      "latest": "2023-12-31"
    },
    "sources": ["Banki.ru", "Sravni.ru"],
    "categories_count": 30
  }
}
```

### Interpreting Health Check Results

**Healthy Database:**
- `"healthy": true`
- All required tables exist
- Row counts > 0 for main tables

**Unhealthy Database:**
- `"healthy": false`
- Missing tables listed in `"missing"` array
- Zero row counts or errors

### Automated Health Checks

Health checks are performed:

1. **On application startup**: Fails fast if database invalid
2. **Via Docker healthcheck**: Every 30 seconds
3. **Via `/health/database` endpoint**: On-demand

## Backup and Restore

### Creating Backups

**Automated backup (during deployment):**

The deployment script automatically creates timestamped backups.

**Manual backup:**

```bash
# On server
ssh deploy@SERVER_IP
cd /home/deploy/actionable-sentiment-backend/database

# Create backup
cp bank_reviews.db "bank_reviews.db.backup-$(date +%Y%m%d-%H%M%S)"

# List backups
ls -lh bank_reviews.db.backup-*
```

**Download backup to local:**

```bash
# From local machine
scp deploy@SERVER_IP:/home/deploy/actionable-sentiment-backend/database/bank_reviews.db ./database/bank_reviews.db.backup-$(date +%Y%m%d)
```

### Restoring from Backup

```bash
# On server
ssh deploy@SERVER_IP
cd /home/deploy/actionable-sentiment-backend

# Stop containers
docker compose down

# Restore from backup
cp database/bank_reviews.db.backup-20250101-120000 database/bank_reviews.db

# Set permissions
chmod 777 database/bank_reviews.db

# Restart
docker compose up -d

# Verify
curl http://localhost:8000/health/database
```

### Backup Strategy

**Recommended schedule:**

- **Before deployments**: Automatic via script
- **Daily**: Cron job on server
- **Before major updates**: Manual backup
- **Weekly**: Download to local storage

**Backup retention:**

- Keep last 7 daily backups on server
- Keep last 4 weekly backups locally
- Archive monthly backups

## Troubleshooting

### Problem: "Database file not found" error

**Symptoms:**
- Deployment workflow fails with "Database file not found"
- Application returns 503 errors
- Logs show `database_error_detected`

**Solution:**

```bash
# Check if database exists on server
ssh deploy@SERVER_IP "ls -lh /home/deploy/actionable-sentiment-backend/database/"

# If missing, deploy database
./scripts/deploy-database.sh staging  # or production
```

### Problem: "No such table" errors

**Symptoms:**
- `/health/database` shows missing tables
- API endpoints return 500 errors
- Logs show "no such table" errors

**Causes:**
- Empty database file created by SQLite
- Corrupted database
- Wrong database file

**Solution:**

```bash
# Verify database locally
sqlite3 database/bank_reviews.db ".tables"

# Should show: annotations  categories  reviews  sentiments  sources

# Re-deploy correct database
./scripts/deploy-database.sh ENVIRONMENT
```

### Problem: Permission errors (WAL mode)

**Symptoms:**
- "unable to open database file"
- "attempt to write a readonly database"
- WAL files not created

**Solution:**

```bash
ssh deploy@SERVER_IP
cd /home/deploy/actionable-sentiment-backend

# Fix permissions
chmod -R 777 database/
chown -R 1000:1000 database/  # Container user

# Restart containers
docker compose restart
```

### Problem: Database locked errors

**Symptoms:**
- "database is locked"
- Slow queries
- Multiple processes accessing database

**Solution:**

```bash
# Check for hanging connections
ssh deploy@SERVER_IP
cd /home/deploy/actionable-sentiment-backend

# Restart containers to clear connections
docker compose restart

# Check WAL mode is active
sqlite3 database/bank_reviews.db "PRAGMA journal_mode;"
# Should return: wal
```

### Problem: Outdated data

**Symptoms:**
- Dashboard shows old data
- Review counts don't match expectations

**Solution:**

```bash
# Check database stats
curl http://SERVER_IP:8000/health/database

# Check date range
# "date_range": {"earliest": "...", "latest": "..."}

# If outdated, deploy updated database
./scripts/deploy-database.sh ENVIRONMENT
```

## FAQ

### Q: Can I update the database without stopping the application?

**A:** No, not recommended. SQLite with WAL mode supports concurrent reads, but updating the entire database file requires stopping the application to avoid corruption.

### Q: How large can the database grow?

**A:** SQLite can handle databases up to 281 TB. Current database is ~4 MB. Monitor growth:

```bash
ssh deploy@SERVER_IP "du -h /home/deploy/actionable-sentiment-backend/database/bank_reviews.db"
```

### Q: Why 777 permissions on database directory?

**A:** SQLite WAL mode needs write access to create `-wal` and `-shm` files. The Docker container runs as a specific user and needs write permissions. In production, consider more restrictive permissions with proper user mapping.

### Q: Can I use PostgreSQL instead of SQLite?

**A:** Yes, but requires:
1. Update `DATABASE_URL` in `.env`
2. Install PostgreSQL on server
3. Update SQLAlchemy connection settings
4. Migrate data from SQLite to PostgreSQL

### Q: How do I update data in the database?

**A:** Options:
1. Update local database, then re-deploy
2. SSH to server, use `sqlite3` CLI to modify
3. Create migration script with Alembic

**Recommended:** Update locally, test on staging, deploy to production.

### Q: What happens if database is missing on startup?

**A:**
- **Production**: Application fails to start (fail-fast)
- **Development/Staging**: Logs warning but continues (for development flexibility)
- Check logs for `database_schema_verification_failed_on_startup`

### Q: How do I check database health from CI/CD?

**A:**

```bash
# In GitHub Actions or other CI/CD
curl -f http://SERVER_IP:8000/health/database | jq '.healthy'
# Returns: true or false
```

### Q: Can I deploy to multiple environments simultaneously?

**A:** Yes, staging and production are independent. Deploy to staging first, test, then production:

```bash
./scripts/deploy-database.sh staging
# Test thoroughly
./scripts/deploy-database.sh production
```

## Additional Resources

- [SQLite WAL Mode](https://www.sqlite.org/wal.html)
- [SQLAlchemy AsyncIO](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- Project: [CLAUDE.md](../CLAUDE.md) - Main project documentation

## Support

If you encounter issues not covered here:

1. Check application logs: `docker compose logs -f`
2. Check database health: `curl http://SERVER_IP:8000/health/database`
3. Review error logs in `logs/` directory
4. Contact development team with:
   - Error messages
   - Health check output
   - Recent deployment changes
