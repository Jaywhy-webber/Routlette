import os

os.chdir(os.path.dirname(__file__))

# Must be set before `main` is imported, since main.py constructs the
# module-level `groq_client` at import time and AsyncGroq raises if no
# api_key is available. Tests never make real Groq calls, so a placeholder
# value is sufficient.
os.environ.setdefault("GROQ_API_KEY", "placeholder-test-key")
