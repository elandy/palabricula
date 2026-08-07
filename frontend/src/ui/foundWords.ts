import { showTooltip } from "./tooltip";
import { state } from "../game/state";
import { WordGroup } from "../types/game";
import {getWordFromCells} from "../utils/puzzleWords";

function getHintLetters(word:string): string {
    word = word.toUpperCase();
    if (word.length <= 4) {
        return word[0] + "***";
    }

    if (word.length <= 6) {
        return word.slice(0,2) +
            "*".repeat(word.length-2);
    }

    return (
        word.slice(0,2) +
        "*".repeat(word.length-4) +
        word.slice(-2)
    );
}

export function renderFoundWords() {
    if (!state.puzzle) {
        throw new Error("Puzzle not initialized");
    }

    const container = document.getElementById("found-words") as HTMLDivElement;
    container.innerHTML = "";
    console.log("FOUND", [...state.normalizedFoundWords]);
    console.log(
        "PUZZLE WORDS",
        Object.values(state.puzzle.words)
            .filter(x => !x.bonus)
            .slice(0,5)
            .map(x => getWordFromCells(state.puzzle!, x).toLowerCase())
    );
    const groups: Record<number, WordGroup> = {};

    for (const [lenStr, total] of Object.entries(state.puzzle.word_lengths || {})) {
        const len = Number(lenStr);
        groups[len] = {
            totalCount: total,
            found: []
        };
    }

    for (const word of state.foundWords) {
        const normalized = word.toLowerCase();
        const len = normalized.length;
        if (!groups[len]) {
            groups[len] = {
                totalCount: 0,
                found: []
            };
        }
        groups[len].found.push(word);
    }

    const remainingWords = Object.entries(state.puzzle.words)
    .filter(([_,info]) => {
        if (info.bonus) return false;
        const word = getWordFromCells(state.puzzle!, info);
        return !state.normalizedFoundWords.has(word.toUpperCase());
    });

    const hintsContainer = document.getElementById("word-hints");

    if (hintsContainer) {
        if (state.hintsUnlocked && remainingWords.length > 0) {
            hintsContainer.classList.remove("hidden");

            const wordsBtn = document.getElementById("missing-words-btn") as HTMLButtonElement;

            const lettersBtn = document.getElementById("missing-letters-btn") as HTMLButtonElement;
            
            wordsBtn.textContent =
                state.showMissingWords
                    ? "✓ Lista de palabras"
                    : "☐ Lista de palabras";


            wordsBtn.onclick = () => {
                state.showMissingWords = !state.showMissingWords;

                // Primeras letras depende de la lista de palabras
                if (!state.showMissingWords) {
                    state.showMissingLetters = false;
                }

                renderFoundWords();
            };


            if (state.showMissingWords) {
                lettersBtn.classList.remove("hidden");

                lettersBtn.textContent =
                    state.showMissingLetters
                        ? "✓ Primeras letras"
                        : "☐ Primeras letras";

                lettersBtn.onclick = () => {
                    state.showMissingLetters = !state.showMissingLetters;
                    renderFoundWords();
                };

            } else {
                lettersBtn.classList.add("hidden");
                state.showMissingLetters = false;
            }

        } else {
            hintsContainer.classList.add("hidden");

            state.showMissingWords = false;
            state.showMissingLetters = false;
        }
    }
    Object.keys(groups)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach(len => {
            const group = groups[len];
            const missing = Math.max(0, group.totalCount - group.found.length);

            const wrapper = document.createElement("div");
            wrapper.className = "word-group";

            const title = document.createElement("div");
            title.className = "word-group-title";
            title.textContent =
                `${len} letras (+${missing} palabras faltantes)`;

            const wordsWrap = document.createElement("div");
            wordsWrap.className = "word-group-words";

            const missingWords = state.puzzle
                ? Object.values(state.puzzle.words)
                    .filter(info => {
                        if (info.bonus) return false;

                        const word = getWordFromCells(
                            state.puzzle!,
                            info
                        );

                        return (
                            word.length === len &&
                            !state.normalizedFoundWords.has(
                                word.toUpperCase()
                            )
                        );
                    })
                    .map(info =>
                        getWordFromCells(
                            state.puzzle!,
                            info
                        )
                    )
                    .sort((a, b) =>
                        a.localeCompare(b, "es", {
                            sensitivity: "base"
                        })
                    )
                : [];


            const missingSet = new Set(
                missingWords.filter(
                    word =>
                        !state.normalizedFoundWords.has(
                            word.toUpperCase()
                        )
                )
            );


            const allWords = [
                ...group.found.map(word => ({
                    word,
                    found: true
                })),
                ...(
                    state.showMissingWords
                        ? [...missingSet].map(word => ({
                            word,
                            found: false
                        }))
                        : []
                )
            ];


            allWords
                .sort((a, b) =>
                    a.word.localeCompare(
                        b.word,
                        "es",
                        {
                            sensitivity: "base"
                        }
                    )
                )
                .forEach(item => {

                    const chip = document.createElement("div");

                    if (item.found) {
                        chip.className = "word-chip found";
                        chip.textContent = item.word;

                        chip.addEventListener("click", () => {
                            const rect = chip.getBoundingClientRect();
                            showTooltip(item.word, rect);
                        });

                    } else {
                        chip.className = "word-chip missing";

                        chip.textContent =
                            state.showMissingLetters
                                ? getHintLetters(item.word)
                                : "*".repeat(item.word.length);
                    }

                    wordsWrap.appendChild(chip);
                });
            wrapper.appendChild(title);
            wrapper.appendChild(wordsWrap);
            container.appendChild(wrapper);
        });

    if (state.foundBonusWords.size > 0) {
        const missingBonus = Math.max(
            0,
            state.puzzle.bonus_word_count - state.foundBonusWords.size
        );
        const wrapper = document.createElement("div");
        wrapper.className = "word-group";

        const title = document.createElement("div");
        title.className = "word-group-title";
        title.textContent = `Palabras bonus (+${missingBonus} palabras faltantes)`;

        const wordsWrap = document.createElement("div");
        wordsWrap.className = "word-group-words";

        [...state.foundBonusWords]
            .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
            .forEach(word => {
                const chip = document.createElement("div");
                chip.className = "word-chip found bonus";
                chip.textContent = word;

                chip.addEventListener("click", () => {
                    const rect = chip.getBoundingClientRect();
                    showTooltip(word, rect);
                });

                wordsWrap.appendChild(chip);
            });

        wrapper.appendChild(title);
        wrapper.appendChild(wordsWrap);
        container.appendChild(wrapper);
    }
}
