import { state } from "../game/state";

export function initShareModal() {

    const button = document.getElementById("share-btn");
    const modal = document.getElementById("share-modal");
    const close = document.getElementById("close-share");
    const textarea = document.getElementById("share-text") as HTMLTextAreaElement;
    const copy = document.getElementById("copy-share") as HTMLButtonElement;

    if (
        !button ||
        !modal ||
        !close ||
        !textarea ||
        !copy
    ) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            const bonus =
                state.normalizedBonusWords.size;

            const total =
                state.puzzle?.total_score ?? 0;

            textarea.value =
`🟩 Palabrícula

Hoy conseguí ${state.score}/${total} puntos
⭐ ${bonus} palabras bonus

¿Puedes superarme?

https://palabricula.com

Hecho por Andrés Politi
https://github.com/elandy/palabricula`;

            modal.classList.remove("hidden");
        }
    );

    close.addEventListener(
        "click",
        () => modal.classList.add("hidden")
    );

    copy.addEventListener(
        "click",
        async () => {

            await navigator.clipboard.writeText(
                textarea.value
            );

            copy.textContent = "✓ Copiado";

            setTimeout(() => {
                copy.textContent = "Copiar";
            }, 2000);

        }
    );

}