import os

from dotenv import load_dotenv
from fastapi import HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

load_dotenv()

def verify_google_token(token: str):
    try:
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        if client_id is None: raise ValueError("GOOGLE_CLIENT_ID not set")

        info = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            client_id,
        )

        return info

    except ValueError as e:

        raise HTTPException(
            status_code=401,
            detail=str(e),
        )