FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    DJANGO_SETTINGS_MODULE=cmspro.settings \
    PORT=8000

WORKDIR /app

# System deps (for psycopg2, pillow, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# Copy Django project (cmspro, content, manage.py, templates, static, etc.)
COPY . /app

# Collect static files
RUN python manage.py collectstatic --noinput

# Run migrations and start server
CMD python manage.py migrate --noinput && gunicorn cmspro.wsgi:application --bind 0.0.0.0:${PORT}