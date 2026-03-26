FROM ghcr.io/astral-sh/uv:debian

WORKDIR /app

COPY pyproject.toml ./
RUN uv sync

COPY . .

EXPOSE 8000

CMD ["uv", "run", "fastapi", "dev", "main.py", "--host", "0.0.0.0", "--port", "8000"]