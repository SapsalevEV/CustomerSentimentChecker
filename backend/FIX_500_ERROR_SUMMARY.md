# Fix for 500 Error - Database Missing Issue

## Problem Summary

**Error:** `/api/dashboard/overview` endpoint returns 500 Internal Server Error

**Root Cause:** Database file (`database/bank_reviews.db`) is missing on staging/production servers

The deployment workflow creates the `database/` directory but never uploads the actual database file. When the application tries to query the database, it either:
1. Doesn't exist → SQLAlchemy fails
2. Creates empty database → queries fail due to missing tables

## Changes Made

### 1. Enhanced Error Logging (`app/api/v1/dashboard.py`)

**Changes:**
- Added detailed error type logging in exception handler
- Added database-specific error detection
- Return 503 (Service Unavailable) for database errors instead of generic 500
- Log helpful hints when database errors detected

**Benefits:**
- Clearer error messages in logs
- Easier to diagnose database vs. other issues
- Proper HTTP status codes for monitoring

### 2. Database Health Check Utility (`app/utils/db_health.py`)

**New file with three main functions:**

1. `check_database_health()` - Comprehensive health check
   - Verifies all required tables exist
   - Checks row counts
   - Identifies missing tables
   - Returns detailed health status

2. `verify_database_schema()` - Startup verification
   - Fails fast if database invalid (production)
   - Logs warning but continues (development)

3. `get_database_stats()` - Database statistics
   - Total reviews/annotations
   - Date range of data
   - Available sources and categories

**Benefits:**
- Proactive database validation
- Early detection of issues
- Comprehensive monitoring data

### 3. Database Health Endpoints (`app/main.py`)

**New endpoint:** `GET /health/database`

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
    ...
  },
  "statistics": {
    "total_reviews": 1321,
    "date_range": {"earliest": "2023-01-01", "latest": "2023-12-31"},
    ...
  }
}
```

**Updated lifespan:**
- Runs database schema verification on startup
- Fails fast in production if database invalid
- Logs detailed startup information

**Benefits:**
- Easy to check database health from CI/CD
- On-demand database diagnostics
- Prevents application from starting with invalid database

### 4. Deployment Workflow Updates

**Files updated:**
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy.yml`

**Changes:**
- Added database file existence check before deployment
- Fails deployment if database missing
- Shows clear instructions how to fix the issue
- Displays helpful error messages with exact commands

**Benefits:**
- Catches missing database before container restart
- Prevents deployments that will fail
- Clear guidance for fixing the issue

### 5. Database Deployment Script (`scripts/deploy-database.sh`)

**New automated script for deploying database to servers**

**Features:**
- Supports staging and production environments
- Creates backup of existing database
- Stops containers before update
- Uploads database via SCP
- Sets correct permissions for WAL mode
- Restarts containers
- Runs health checks
- Verifies database is working

**Usage:**
```bash
./scripts/deploy-database.sh staging
./scripts/deploy-database.sh production
```

**Benefits:**
- Automated, consistent deployment process
- Safe: creates backups before changes
- Comprehensive: includes health checks
- User-friendly: colored output with progress

### 6. Documentation Updates

#### Updated `CLAUDE.md`:
- Added "Database Deployment" section
- Clear instructions for automated and manual deployment
- Troubleshooting tips
- Health check verification steps

#### New `docs/database-setup.md`:
- Complete database deployment guide
- Step-by-step instructions for staging and production
- Backup and restore procedures
- Comprehensive troubleshooting section
- FAQ with common questions
- 250+ lines of detailed documentation

#### Updated `scripts/README.md`:
- Added documentation for `deploy-database.sh`
- Usage examples
- Requirements and prerequisites

## Immediate Action Required

### To Fix Staging Server (89.23.99.74)

Run the database deployment script:

```bash
./scripts/deploy-database.sh staging
```

This will:
1. Upload `database/bank_reviews.db` to staging server
2. Set correct permissions
3. Restart containers
4. Verify database health

**Verify fix:**
```bash
curl http://89.23.99.74:8000/health/database
curl -X POST http://89.23.99.74:8000/api/dashboard/overview \
  -H "Content-Type: application/json" \
  -d '{"date_range":{"from":"2023-01-01T00:00:00Z","to":"2023-12-31T23:59:59Z"},"filters":{}}'
```

### To Fix Production Server (193.233.102.193)

Same process for production:

```bash
./scripts/deploy-database.sh production
```

## Files Changed

### Modified Files:
1. `app/api/v1/dashboard.py` - Enhanced error handling
2. `app/main.py` - Added health endpoint and startup verification
3. `.github/workflows/deploy-staging.yml` - Added database check
4. `.github/workflows/deploy.yml` - Added database check
5. `CLAUDE.md` - Added database deployment docs
6. `scripts/README.md` - Added deploy-database.sh docs

### New Files:
1. `app/utils/db_health.py` - Database health check utility
2. `scripts/deploy-database.sh` - Database deployment script
3. `docs/database-setup.md` - Complete database guide

## Testing Checklist

After deploying these changes:

- [ ] Deploy code changes to staging
- [ ] Deploy database to staging using script
- [ ] Verify `/health` endpoint returns 200
- [ ] Verify `/health/database` shows `"healthy": true`
- [ ] Test `/api/dashboard/overview` endpoint
- [ ] Check application logs for startup messages
- [ ] Repeat for production

## Future Improvements

1. **Database migrations**: Consider using Alembic for schema changes
2. **Automated backups**: Add cron job for daily database backups
3. **Database monitoring**: Add metrics for database size, query performance
4. **PostgreSQL migration**: Consider migrating to PostgreSQL for better concurrency

## Rollback Plan

If issues occur after deployment:

1. **Code rollback:**
   ```bash
   git revert <commit-hash>
   git push origin develop  # or main
   ```

2. **Database rollback:**
   ```bash
   ssh deploy@SERVER_IP
   cd /home/deploy/actionable-sentiment-backend
   docker compose down
   cp database/bank_reviews.db.backup-TIMESTAMP database/bank_reviews.db
   docker compose up -d
   ```

## Support

For issues or questions:
- Check logs: `docker compose logs -f`
- Check health: `curl http://SERVER_IP:8000/health/database`
- Review: `docs/database-setup.md`
- Contact: Development team

---

**Summary:** The 500 error was caused by a missing database file on the server. These changes add proper database validation, health checks, automated deployment scripts, and comprehensive documentation to prevent this issue in the future.
