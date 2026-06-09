FROM python:3.12-slim AS deps

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build
COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt


FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/usr/local/bin:$PATH"

RUN useradd --create-home --shell /bin/bash --uid 1001 ziyada
WORKDIR /app

COPY --from=deps /install /usr/local
COPY --chown=ziyada:ziyada app ./app
COPY --chown=ziyada:ziyada seed ./seed

# Pre-create runtime-writable dirs so named volume mounts inherit
# the right ownership (otherwise Docker creates the mount-point as root
# and SessionStore can't mkdir under it).
RUN mkdir -p /app/.data && chown ziyada:ziyada /app/.data

USER ziyada
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health',timeout=2).status==200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
