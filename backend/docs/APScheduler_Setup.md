# APScheduler Integration for Product Sync

## Overview
This document describes the APScheduler integration that replaces FastAPI BackgroundTasks with fully automated daily product synchronization from the G2A API.

## Features Implemented

### 1. Automated Daily Sync
- **Schedule**: Daily at 2:00 AM UTC (configurable via environment variables)
- **Function**: Uses existing `sync_all_products_paginated()` from product_service.py
- **Logging**: Comprehensive logging to `logs/product_sync_scheduler.log`

### 2. Manual Sync Triggers
- **API Endpoint**: `POST /api/v1/scheduler/sync/manual`
- **Authentication**: Requires admin or manager role
- **Execution**: Immediate scheduling via APScheduler

### 3. Scheduler Management
- **Status Monitoring**: `GET /api/v1/scheduler/status`
- **Job Listing**: `GET /api/v1/scheduler/jobs`
- **Schedule Changes**: `PUT /api/v1/scheduler/schedule/daily`

## Configuration

### Environment Variables
```bash
# Scheduler Configuration
SYNC_SCHEDULE_HOUR=2      # Daily sync hour (0-23)
SYNC_SCHEDULE_MINUTE=0    # Daily sync minute (0-59)
```

### Dependencies Added
```
APScheduler==3.10.4
```

## API Endpoints

### Product Sync Endpoints
- `POST /api/v1/products/sync` - Manual sync trigger (no BackgroundTasks)
- `POST /api/v1/products/sync?page=1` - Single page sync

### Scheduler Management Endpoints
- `GET /api/v1/scheduler/status` - Scheduler status (no auth required)
- `GET /api/v1/scheduler/jobs` - List all scheduled jobs (admin/manager)
- `GET /api/v1/scheduler/jobs/{job_id}` - Get specific job status (admin/manager)
- `POST /api/v1/scheduler/sync/manual` - Trigger manual sync (admin/manager)
- `PUT /api/v1/scheduler/schedule/daily` - Reschedule daily sync (admin only)

## Logging

### Log Files
- **File**: `logs/product_sync_scheduler.log`
- **Format**: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`
- **Content**: Start/end timestamps, product counts, error details, duration

### Log Levels
- **INFO**: Normal operations, job starts/completions
- **ERROR**: Failures, exceptions with full tracebacks

## Usage Examples

### Start the Application
```bash
python run.py
```
The scheduler starts automatically and schedules the daily sync.

### Trigger Manual Sync
```bash
curl -X POST "http://localhost:8000/api/v1/scheduler/sync/manual" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Check Scheduler Status
```bash
curl "http://localhost:8000/api/v1/scheduler/status"
```

### Reschedule Daily Sync
```bash
curl -X PUT "http://localhost:8000/api/v1/scheduler/schedule/daily?hour=3&minute=30" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Architecture Changes

### Before (BackgroundTasks)
```python
@router.post("/sync")
async def sync_products(background_tasks: BackgroundTasks):
    background_tasks.add_task(sync_function)
    return {"status": "started"}
```

### After (APScheduler)
```python
@router.post("/sync")
async def sync_products():
    job_id = await scheduler_service.trigger_manual_sync()
    return {"job_id": job_id, "status": "scheduled"}
```

## Benefits

1. **Persistent Scheduling**: Survives application restarts
2. **Configurable Timing**: Environment-based schedule configuration
3. **Better Monitoring**: Dedicated logging and job status tracking
4. **Role-based Access**: Authentication for scheduler management
5. **Error Resilience**: Comprehensive error handling and reporting

## Monitoring

### Daily Sync Logs
```
2025-09-17 02:00:00,123 - scheduler - INFO - === DAILY PRODUCT SYNC STARTED at 2025-09-17T02:00:00 ===
2025-09-17 02:05:30,456 - scheduler - INFO - === DAILY PRODUCT SYNC COMPLETED SUCCESSFULLY ===
Duration: 330.33 seconds
Products Synced: 15420
Pages Processed: 771
Errors: 0
End Time: 2025-09-17T02:05:30
```

### Error Handling
```
2025-09-17 02:00:00,123 - scheduler - ERROR - === DAILY PRODUCT SYNC FAILED ===
Duration: 45.67 seconds
Error: Connection timeout to G2A API
End Time: 2025-09-17T02:00:45
Full traceback:
[detailed traceback information]
```

## Troubleshooting

### Common Issues
1. **Scheduler not starting**: Check APScheduler dependency installation
2. **Jobs not running**: Verify scheduler service is started in main.py lifespan
3. **Permission errors**: Ensure logs directory exists and is writable
4. **Authentication failures**: Verify JWT tokens and user roles

### Debug Commands
```bash
# Check if scheduler is running
curl "http://localhost:8000/api/v1/scheduler/status"

# List all scheduled jobs
curl -H "Authorization: Bearer TOKEN" "http://localhost:8000/api/v1/scheduler/jobs"

# Check log files
tail -f logs/product_sync_scheduler.log
```
