# Environment Variables Setup Guide

## Local Development Setup

### 1. Copy the Example File
```bash
cp .env.example .env
```

### 2. Update `.env` with Your Settings
The `.env` file is already created with default development settings:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,127.0.0.1:8000

# Database (Uses SQLite by default)
DATABASE_URL=

# CSRF Settings
CSRF_TRUSTED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

This installs `python-dotenv` which automatically loads the `.env` file.

### 4. Run Local Server
```bash
python manage.py runserver
```

The app will now use the variables from `.env`.

---

## Production Deployment (Render)

### Environment Variables to Set on Render Dashboard:

1. **Go to**: Services → Your Service → Environment
2. **Add these variables**:

| Variable | Value | Example |
|----------|-------|---------|
| `SECRET_KEY` | Your production secret key | `django-insecure-xxx...` |
| `DEBUG` | `False` | Set to False for production |
| `ALLOWED_HOSTS` | Your Render domain | `3hc-django.onrender.com` |
| `DATABASE_URL` | Auto-set by Render | Auto-populated |

### Generate Secure SECRET_KEY for Production:
```bash
python manage.py shell
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

Then copy the output and set it as `SECRET_KEY` in Render.

---

## Environment Variables Explained

### Django Settings
- **DEBUG**: 
  - `True` for development (shows detailed error pages)
  - `False` for production (hides sensitive info)
  
- **SECRET_KEY**: 
  - Used for session encryption
  - Must be unique and secret
  - Never commit to version control

- **ALLOWED_HOSTS**: 
  - Comma-separated list of allowed domains
  - For local: `localhost,127.0.0.1`
  - For production: `your-domain.com`

### Database
- **DATABASE_URL**: 
  - Leave empty for SQLite (development)
  - Auto-set by Render to PostgreSQL in production
  - Format: `postgresql://user:password@host/dbname`

### Security
- **CSRF_TRUSTED_ORIGINS**:
  - Trusted domains for CSRF protection
  - Add your production domain here

---

## Important Notes

⚠️ **Security**: 
- `.env` is in `.gitignore` and NOT committed to git
- Never share your `.env` file with anyone
- Never commit secrets to version control

✅ **Development**:
- Use `.env.example` as a template
- Copy to `.env` for local development
- `.env` is loaded automatically by `python-dotenv`

✅ **Production**:
- Set variables directly on Render dashboard
- Use strong, unique `SECRET_KEY`
- Never use development `SECRET_KEY` in production
