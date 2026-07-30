import { updateProgress } from "../ui/progressUI";
import { state } from "./state";
import {
    startSelection,
    handlePointerMove,
    finishSelection
} from "./selection";
import {updateBoardExhaustion} from "./boardExhaustion";
import {updateBoardHints} from "./boardHints";

export function renderBoard() {
    if (!state.puzzle) {
        throw new Error("Cannot render board without puzzle");
    }
    const board = document.getElementById("board")!;
    board.innerHTML = "";

    const size = state.puzzle.size;
    board.style.gridTemplateColumns = `repeat(${size}, 70px)`;

    // board width = cells + gaps between them + left/right padding + left/right border
    const cellSize = 70;
    const gap = 6;
    const padding = 10; // per side
    const border = 3;   // per side
    const boardWidth = size * cellSize + (size - 1) * gap + padding * 2 + border * 2;
    document.documentElement.style.setProperty("--board-width", `${boardWidth}px`);

    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.setAttribute("translate", "no");
            cell.textContent = state.puzzle.board[row][col];
            cell.dataset.row = String(row);
            cell.dataset.col = String(col);
            cell.dataset.letter = state.puzzle.board[row][col];
            cell.addEventListener("pointerdown", startSelection);
            board.appendChild(cell);
        }
    }
    board.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishSelection);
    updateProgress();
    updateBoardExhaustion();
    updateBoardHints();
}
