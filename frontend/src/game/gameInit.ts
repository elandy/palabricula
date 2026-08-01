import {getTodayPuzzle, getOrCreateSession, getProgress, loginBrowser} from "../services/api";
import { renderBoard } from "./board";
import { askUsername } from "./username";
import { updateProgress } from "../ui/progressUI";
import { renderFoundWords } from "../ui/foundWords";
import { setGameState } from "./state";
import {Puzzle} from "../types/api";
import {sha256} from "../utils/hash";
import {updateBoardHints} from "./boardHints";
import {updateAuthButtons} from "../ui/loginModal";

function buildCellUsage(puzzle: Puzzle): Map<string, Set<string>> {
    const usage = new Map<string, Set<string>>();
    for (const [hash, info] of Object.entries(puzzle.words)) {
        if (info.bonus) continue;
        for (const [row, col] of info.cells) {
            const key = `${row},${col}`;
            if (!usage.has(key)) {
                usage.set(key, new Set());
            }
            usage.get(key)!.add(hash);
        }
    }
    console.log("cellUsage", usage);
    return usage;
}

async function loadProgress(sessionId: string, puzzle: Puzzle) {
    const progress = await getProgress(sessionId);
    const foundWordHashes = new Set(
        await Promise.all(
            (progress.words ?? []).map(word =>
                sha256(word + puzzle.id)
            )
        )
    );

    setGameState({
        normalizedFoundWords: new Set(progress.words || []),
        normalizedBonusWords: new Set(progress.bonus_words || []),
        foundWords: new Set(progress.display_words || []),
        foundBonusWords: new Set(progress.display_bonus_words || []),
        score: progress.score || 0,
        foundWordHashes,
    });

    updateProgress();
    renderFoundWords();
    updateBoardHints();
    const username = progress.username || "Anonimo";
    const playerInfo = document.getElementById("player-info");

    if (playerInfo) {
        playerInfo.textContent = username;
    }
}

function getOrCreateBrowserId(): string {
    let browserId = localStorage.getItem("browser_id");
    if (!browserId) {
        browserId = crypto.randomUUID();
        localStorage.setItem("browser_id", browserId);
    }
    return browserId;
}

export async function init() {
    const puzzle = await getTodayPuzzle();
    const browserId = getOrCreateBrowserId();
    const existingPlayerId = localStorage.getItem("player_id");
    const authProvider = localStorage.getItem("auth_provider");

    let player;

    if (authProvider === "google" && existingPlayerId) {
        player = {
            player_id: existingPlayerId,
            username: localStorage.getItem("username"),
        };
    } else {
        /*  Authenticate browser.
            Existing users: browser_id + player_id -> create identity linked to existing player
            New users: browser_id -> create player  */
        player = await loginBrowser(browserId, existingPlayerId);
        localStorage.setItem("player_id", player.player_id);

        if (player.username) {
            localStorage.setItem("username", player.username);
        }
    }

    updateAuthButtons();

    /*  Username is now independent of session creation.
        If your current UX requires username before playing,
        keep this block.
        Later this can move to player creation.  */
    if (!player.username) {
        player = await askUsername(player.player_id);
        localStorage.setItem("player_id", player.player_id);

        if (player.username) {
            localStorage.setItem("username", player.username);
        }

        updateAuthButtons();
    }

    const session = await getOrCreateSession(
        puzzle.id,
        player.player_id
    );
    const sessionId = session.session_id;
    localStorage.setItem("session_id", sessionId);
    localStorage.setItem("session_puzzle_id", puzzle.id);

    setGameState({ puzzle, sessionId, cellUsage: buildCellUsage(puzzle) });
    await loadProgress(sessionId, puzzle);
    renderBoard();
}
