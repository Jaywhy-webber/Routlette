import os

# Must be set before `main` is imported, since main.py builds the module-level
# `_jwks_client` (truthy/falsy gate for verify_token's guest path) at import
# time from this env var. PyJWKClient does not perform any network call at
# construction time, so a placeholder URL works here.
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")

from unittest.mock import Mock, patch

import pytest
from fastapi import HTTPException

import main


def test_verify_token_returns_guest_when_header_is_missing():
    assert main.verify_token(authorization=None) == "guest"


def test_verify_token_still_rejects_a_malformed_header():
    with pytest.raises(HTTPException) as exc_info:
        main.verify_token(authorization="not-a-bearer-token")
    assert exc_info.value.status_code == 401


def test_verify_token_returns_anonymous_when_no_jwks_client():
    original = main._jwks_client
    main._jwks_client = None
    try:
        assert main.verify_token(authorization=None) == "anonymous"
        assert main.verify_token(authorization="Bearer sometoken") == "anonymous"
    finally:
        main._jwks_client = original


def test_verify_token_valid_jwt_returns_sub_claim():
    with patch.object(main._jwks_client, "get_signing_key_from_jwt", return_value=Mock(key="secret")), \
         patch.object(main.pyjwt, "decode", return_value={"sub": "user-123"}):
        result = main.verify_token(authorization="Bearer sometoken")
    assert result == "user-123"


def test_verify_token_expired_signature_raises_401():
    with patch.object(main._jwks_client, "get_signing_key_from_jwt", return_value=Mock(key="secret")), \
         patch.object(main.pyjwt, "decode", side_effect=main.pyjwt.ExpiredSignatureError()):
        with pytest.raises(HTTPException) as exc_info:
            main.verify_token(authorization="Bearer sometoken")
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Token expired"


def test_verify_token_invalid_token_raises_401():
    with patch.object(main._jwks_client, "get_signing_key_from_jwt", return_value=Mock(key="secret")), \
         patch.object(main.pyjwt, "decode", side_effect=main.pyjwt.InvalidTokenError()):
        with pytest.raises(HTTPException) as exc_info:
            main.verify_token(authorization="Bearer sometoken")
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid token"
