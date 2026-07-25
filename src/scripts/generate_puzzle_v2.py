import json
import random
from collections import Counter
from datetime import date
from pathlib import Path
from statistics import mean

from wordfreq import zipf_frequency

from src.utils.normalize import normalize
import argparse

class InvalidPuzzle(Exception):
    pass

# ==========================================
# CONFIG
# ==========================================
BONUS_ZIPF_THRESHOLD = 3
SIZE = 4

MIN_WORDS = 80
MAX_WORDS = 1000

LETTERS = (
    "EEEEEEEEEEEE"
    "AAAAAAAAAAA"
    "OOOOOOOOOO"
    "SSSSSSSS"
    "NNNNNNN"
    "RRRRRRR"
    "IIIIIII"
    "LLLLL"
    "DDDDD"
    "TTTTT"
    "CCCC"
    "UUUU"
    "MMMM"
    "PPPP"
    "BBB"
    "GGG"
    "VV"
    "YY"
    "HH"
    "FF"
    "ZZ"
    "JJ"
    "Ñ"
)

DIRECTIONS = [
    (-1, -1), (-1, 0), (-1, 1),
    (0, -1),           (0, 1),
    (1, -1),  (1, 0),  (1, 1)
]

def search(board, trie):
    found = {}
    n = len(board)

    def dfs(x, y, node, visited, path):
        letter = board[x][y]
        if letter not in node.children:
            return

        node = node.children[letter]
        visited.add((x, y))
        path.append((x, y))

        if node.word:
            key = node.word["normalized"]
            if key not in found:
                found[key] = {
                    "display": node.word["display"],
                    "normalized": node.word["normalized"],
                    "path": path.copy(),
                }

        for dx, dy in DIRECTIONS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < n and 0 <= ny < n and (nx, ny) not in visited:
                dfs(nx, ny, node, visited, path)

        path.pop()
        visited.remove((x, y))

    for i in range(n):
        for j in range(n):
            dfs(i, j, trie.root, set(), [])

    return found

# ==========================================
# BOARD UTILITIES
# ==========================================

def parse_board(text):
    rows = text.split("/")
    return [[normalize(c) for c in row] for row in rows]


def generate_board():
    return [
        [random.choice(LETTERS) for _ in range(SIZE)]
        for _ in range(SIZE)
    ]


# ==========================================
# LOAD DICTIONARY (lazy, cached)
# ==========================================
class TrieNode:
    def __init__(self):
        self.children = {}
        self.word = None


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, normalized_word, display_word):
        node = self.root
        for ch in normalized_word:
            node = node.children.setdefault(ch, TrieNode())

        node.word = {
            "display": display_word,
            "normalized": normalized_word,
        }

    def contains(self, word):
        node = self.root

        for ch in word:
            node = node.children.get(ch)
            if node is None:
                return False

        return node.word is not None

_trie = None

def get_trie():
    global _trie

    if _trie is not None:
        return _trie

    trie = Trie()
    data_file = Path(__file__).parent.parent / "data" / "Spanish.txt"

    with open(data_file, encoding="utf-16") as f:
        for line in f:
            original = line.strip()
            normalized = normalize(original)
            trie.insert(normalized, original.upper())

    _trie = trie
    return trie


def random_path(length: int):
    if not 1 <= length <= SIZE * SIZE:
        raise ValueError("Invalid path length")

    while True:
        start = (
            random.randrange(SIZE),
            random.randrange(SIZE),
        )

        path = [start]
        visited = {start}

        while len(path) < length:
            x, y = path[-1]

            neighbors = [
                (nx, ny)
                for dx, dy in DIRECTIONS
                if 0 <= (nx := x + dx) < SIZE
                and 0 <= (ny := y + dy) < SIZE
                and (nx, ny) not in visited
            ]

            if not neighbors:
                break

            nxt = random.choice(neighbors)
            visited.add(nxt)
            path.append(nxt)

        if len(path) == length:
            return path

def generate_board_from_word(word: str):
    word = normalize(word)

    if len(word) > SIZE * SIZE:
        raise ValueError("Word is too long")

    board = [
        [None] * SIZE
        for _ in range(SIZE)
    ]

    path = random_path(len(word))

    for letter, (r, c) in zip(word, path):
        board[r][c] = letter

    for r in range(SIZE):
        for c in range(SIZE):
            if board[r][c] is None:
                board[r][c] = random.choice(LETTERS)

    return board

# ==========================================
# ANALYSIS
# ==========================================

def analyze(normal_words, bonus_words):
    lengths = [len(w) for w in normal_words]

    return {
        "count": len(normal_words),
        "bonus_count": len(bonus_words),
        "avg_length": round(mean(lengths), 2),
        "max_length": max(lengths),
        "length_distribution": dict(Counter(lengths)),
        "score": sum(len(w) - 3 for w in normal_words)
    }


def board_score(words):
    return sum(len(w) - 3 for w in words)

_word_frequency_cache = {}

def is_bonus_word(word: str) -> bool:
    freq = _word_frequency_cache.get(word)

    if freq is None:
        freq = zipf_frequency(word.lower(), "es")
        _word_frequency_cache[word] = freq

    return freq < BONUS_ZIPF_THRESHOLD

def generate_puzzle(board, puzzle_date: date | None =None, solutions=None):
    trie = get_trie()

    if len(board) != SIZE or any(len(r) != SIZE for r in board): raise InvalidPuzzle("Board must be 4x4")
    if solutions is None:
        solutions = search(board, trie)

    words = set(solutions.keys())
    bonus_lookup = {
        w: is_bonus_word(w)
        for w in words
    }
    normal_words = {
        w
        for w, bonus in bonus_lookup.items()
        if not bonus
    }
    bonus_words = words - normal_words

    used = {
        cell
        for word in normal_words
        for cell in solutions[word]["path"]
    }

    has_long_word = any(len(w) >= 10 for w in normal_words)
    if len(used) != SIZE * SIZE: raise InvalidPuzzle("Board has unused tiles")
    if not (MIN_WORDS <= len(normal_words) <= MAX_WORDS): raise InvalidPuzzle("Invalid word count")
    if not has_long_word: raise InvalidPuzzle("No long word")

    stats = analyze(normal_words, bonus_words)
    score = board_score(normal_words)

    # IMPORTANT CHANGE HERE
    if puzzle_date is None:
        puzzle_date = date.today()

    puzzle_id = puzzle_date.isoformat()

    daily_solution = {
        "id": puzzle_id,
        "size": SIZE,
        "board": board,
        "word_count": len(words),
        "words": sorted(
            [
                {
                    "display": data["display"],
                    "normalized": data["normalized"],
                    "bonus": bonus_lookup[data["normalized"]]
                }
                for data in solutions.values()
            ],
            key=lambda w: w["normalized"],
        ),
        "paths": {
            k: [[r, c] for r, c in v["path"]]
            for k, v in solutions.items()
        },
        "stats": stats,
    }

    daily_puzzle = {
        "id": puzzle_id,
        "size": SIZE,
        "board": board,
        "word_count": len(words),
    }

    return {
        "board": board,
        "solutions": solutions,
        "words": words,
        "stats": stats,
        "puzzle": daily_puzzle,
        "solution": daily_solution,
        "attempts": 1,
    }

def find_puzzle(seed_word=None, puzzle_date=None):
    trie = get_trie()

    normalized_seed = None
    if seed_word:
        normalized_seed = normalize(seed_word)
        if not trie.contains(normalized_seed):
            raise ValueError(f"{seed_word} not found")
        if is_bonus_word(normalized_seed):
            raise ValueError("Seed word is a bonus word.")
        if len(normalized_seed) < 8:
            raise ValueError("Seed word too short")
        if len(normalized_seed) > SIZE * SIZE:
            raise ValueError("Seed word too long")

    attempts = 0

    while True:
        attempts += 1

        if normalized_seed:
            board = generate_board_from_word(normalized_seed)
        else:
            board = generate_board()

        solutions = search(board, trie)
        if normalized_seed and normalized_seed not in solutions:
            continue

        try:
            result = generate_puzzle(board, puzzle_date=puzzle_date, solutions=solutions)
        except InvalidPuzzle:
            continue

        if normalized_seed and result["solutions"][normalized_seed]["normalized"] != normalized_seed:
            continue

        result["attempts"] = attempts
        return result

# ==========================================
# CLI
# ==========================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--board", help="Board like ABCD/EFGH/IJKL/MNOP")
    group.add_argument("--word", help="Generate around this word.")
    args = parser.parse_args()

    if args.board:
        result = generate_puzzle(parse_board(args.board))
    else:
        result = find_puzzle(seed_word=args.word)

    with open("daily_solution.json", "w", encoding="utf-8") as f:
        json.dump(result["solution"], f, ensure_ascii=False, indent=2)

    with open("daily_puzzle.json", "w", encoding="utf-8") as f:
        json.dump(result["puzzle"], f, ensure_ascii=False, indent=2)

    print("Saved files")