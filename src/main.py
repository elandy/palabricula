import asyncio
from datetime import datetime
from typing import Annotated

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, StringConstraints

from src.services.rae_service import get_definition
from src.services.puzzle_service import PuzzleService
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Query

from src.utils.normalize import normalize
from src.utils.google_auth import verify_google_token

app = FastAPI(title="Palabricula API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://palabricula.elandy.workers.dev",
        "http://localhost:5500",
        "http://localhost:5173",
        "https://palabricula.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = PuzzleService()

# ==========================================================
# MODELS
# ==========================================================

class SubmitWordRequest(BaseModel):
    session_id: str
    word: str

class CreateSessionRequest(BaseModel):
    puzzle_id: str
    player_id: str | None = None

class SessionResponse(BaseModel):
    session_id: str
    puzzle_id: str
    created_at: datetime

Username = Annotated[
    str,
    StringConstraints(
        min_length=4,
        max_length=25,
        pattern=r"^[A-Za-z0-9]+$",
    ),
]

class SetPlayerNameRequest(BaseModel):
    player_id: str
    username: Username

class BrowserAuthRequest(BaseModel):
    provider_id: str
    player_id: str | None = None

class GoogleAuthRequest(BaseModel):
    id_token: str
    player_id: str | None = None

class AuthResponse(BaseModel):
    player_id: str
    username: str | None


# ==========================================================
# HEALTH
# ==========================================================

@app.get("/health")
async def health():
    return {"status": "ok"}

# ==========================================================
# PUZZLES
# ==========================================================

@app.get("/puzzle/today")
async def get_today_puzzle():
    """
    Returns today's puzzle.
    """

    puzzle = service.get_today_puzzle()

    if not puzzle:
        raise HTTPException(404, "Puzzle not found")

    return puzzle

@app.get("/puzzle/{puzzle_id}")
async def get_puzzle(puzzle_id: str):

    puzzle = service.get_puzzle(puzzle_id)

    if not puzzle:
        raise HTTPException(404, "Puzzle not found")

    return puzzle

# ==========================================================
# SESSION
# ==========================================================

@app.post("/session", response_model=SessionResponse)
async def create_session(request: CreateSessionRequest):
    session_id = service.get_or_create_session(
        puzzle_id=request.puzzle_id,
        player_id=request.player_id,
    )

    return SessionResponse(
        session_id=session_id,
        puzzle_id=request.puzzle_id,
        created_at=datetime.now(),
    )

@app.get("/session/{session_id}")
async def get_session(session_id: str):

    session = service.get_session(session_id)

    if not session:
        raise HTTPException(404, "Session not found")

    return session

@app.post("/player_name")
async def set_player_name(request: SetPlayerNameRequest):
    player = service.set_player_username(
        player_id=request.player_id,
        username=request.username,
    )

    return {
        "id": player.id,
        "username": player.username,
    }

# ==========================================================
# AUTHENTICATION
# ==========================================================

@app.post("/auth/browser", response_model=AuthResponse)
async def auth_browser(request: BrowserAuthRequest):
    player = service.resolve_identity(
        provider="browser",
        provider_user_id=request.provider_id,
        legacy_player_id=request.player_id,
    )
    return AuthResponse(**player)

@app.post("/auth/google", response_model=AuthResponse)
async def auth_google(request: GoogleAuthRequest):

    google_user = verify_google_token(
        request.id_token
    )

    player = service.resolve_identity(
        provider="google",
        provider_user_id=google_user["sub"],
        legacy_player_id=request.player_id,
    )

    return AuthResponse(
        player_id=player["player_id"],
        username=player["username"],
    )

# ==========================================================
# GAMEPLAY
# ==========================================================

@app.post("/submit-word")
async def submit_word(request: SubmitWordRequest):
    word = normalize(request.word)
    return service.submit_word(
        session_id=request.session_id,
        word=word
    )

@app.get("/progress/{session_id}")
async def get_progress(session_id: str):

    progress = service.get_progress(session_id)

    if not progress:
        raise HTTPException(404, "Session not found")

    return progress

# ==========================================================
# LEADERBOARD & STATISTICS
# ==========================================================

@app.get("/leaderboard/today")
async def leaderboard_today():
    return service.get_today_leaderboard()

@app.get("/leaderboard/{puzzle_id}")
async def leaderboard(puzzle_id: str):
    return service.get_leaderboard(puzzle_id=puzzle_id)

@app.get("/player/{player_id}/statistics")
async def player_statistics(player_id: str):
    return service.get_player_statistics(player_id=player_id)

# ==========================================================
# RAE
# ==========================================================

@app.get("/dictionary/rae")
async def rae_lookup(q: str = Query(..., min_length=1)):
    return await asyncio.to_thread(get_definition, q)