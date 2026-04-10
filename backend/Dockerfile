FROM python:3.12

# 1. Combined System Libraries (Old + New)
RUN apt-get update && apt-get install -y \
    # --- Previously working (OpenCV fixes) ---
    libgl1 \
    libglib2.0-0 \
    # --- New Additions (OCR & Unstructured) ---
    tesseract-ocr \
    tesseract-ocr-eng \
    libtesseract-dev \
    poppler-utils \
    libmagic-dev \
    # --- Cleanup ---
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copy the rest of the code
COPY . .

# Port matches the uvicorn port in docker-compose
EXPOSE 8000

# Start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]