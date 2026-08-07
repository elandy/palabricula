import { Puzzle, WordInfo } from "../types/api";

export function getWordFromCells(
    puzzle: Puzzle,
    info: WordInfo
): string {
    return info.cells
        .map(([row, col]) => puzzle.board[row][col])
        .join("")
        .toLowerCase();
}