# Slim-bookworm is the better choice for ML projects — pre-built wheels
# for sklearn, numpy, pandas etc. mean fast, reliable builds.
FROM python:3.11-slim-bookworm

WORKDIR /app

# Install system libraries for Postgres
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy app code and models
COPY . .

# Run as a Non-Root User
RUN adduser --disabled-password --gecos "" appuser
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]