import os

# Must be set before `main` is imported, since main.py builds the module-level
# `_jwks_client` (truthy/falsy gate for verify_token's guest path) at import
# time from this env var. PyJWKClient does not perform any network call at
# construction time, so a placeholder URL is sufficient here.
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")

import pytest
from fastapi import HTTPException

import main


def test_verify_token_returns_guest_when_header_is_missing():
    assert main.verify_token(authorization=None) == "guest"


def test_verify_token_still_rejects_a_malformed_header():
    with pytest.raises(HTTPException) as exc_info:
        main.verify_token(authorization="not-a-bearer-token")
    assert exc_info.value.status_code == 401
