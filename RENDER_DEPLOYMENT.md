# Render Deployment Guide

## Prerequisites
- GitHub account with the repository pushed
- Render account (https://render.com)

## Quick Start

### 1. Connect Your GitHub Repository
1. Go to https://render.com/dashboard
2. Click "New +" and select "Blueprint"
3. Connect your GitHub account and select the `3hc-django` repository

### 2. Render Configuration
The `render.yaml` file automatically configures:
- **Web Service**: Django app with gunicorn
- **PostgreSQL Database**: Automatically provisioned
- **Python Version**: 3.11
- **Build Command**: Runs migrations and collects static files

### 3. Environment Variables (Set in Render Dashboard)
Render automatically sets:
- `DATABASE_URL` - PostgreSQL connection string
- `RENDER_ENV` - Set to "production"

**Additional variables to set manually:**
- `SECRET_KEY` - Update with a secure random key (use Django's `get_random_secret_key()`)
- `ALLOWED_HOSTS` - Your Render domain (e.g., `3hc-django.onrender.com`)

### 4. Deploy
1. Push to GitHub:
   ```bash
   git add .
   git commit -m "Add Render deployment config"
   git push
   ```

2. The deployment will automatically trigger:
   - Install dependencies from `requirements.txt`
   - Run `python manage.py migrate`
   - Run `python manage.py collectstatic`
   - Start the gunicorn server

### 5. Post-Deployment
After successful deployment:

1. **Create Admin User** (if needed):
   - Access Render Shell: Dashboard → Your Service → Shell
   - Run: `python manage.py createsuperuser`

2. **View Logs**:
   - Dashboard → Your Service → Logs

3. **Database Access**:
   - The PostgreSQL database is automatically created
   - Connection string available in `DATABASE_URL` environment variable

## File Structure
```
render.yaml          # Render deployment configuration
build.sh            # Build script (runs during deployment)
cmspro/settings.py  # Updated with Render support
requirements.txt    # Added dj-database-url
```

## Troubleshooting

### Database Migration Issues
- Check logs: Dashboard → Service → Logs
- Verify database connection: Check `DATABASE_URL` variable

### Static Files Not Loading
- Run `collectstatic`: Access Shell and run `python manage.py collectstatic`
- Check STATIC_ROOT and STATIC_URL in settings

### Permission Denied on build.sh
Make the script executable locally:
```bash
chmod +x build.sh
git add build.sh
git commit -m "Make build.sh executable"
git push
```

## Production Checklist
- [ ] Update `SECRET_KEY` to a secure value
- [ ] Set `DEBUG = False` (configured via `DEBUG` env var)
- [ ] Update `ALLOWED_HOSTS` with your domain
- [ ] Configure `CSRF_TRUSTED_ORIGINS` if needed
- [ ] Test admin panel access
- [ ] Verify media/static file serving
- [ ] Set up error monitoring (optional)

## More Information
- [Render Django Documentation](https://render.com/docs/deploy-django)
- [Render Environment Variables](https://render.com/docs/environment-variables)
