export function startPuzzleCountdown(elementId: string) {
    const element = document.getElementById(elementId) as HTMLElement;

    if (!element) {
        return;
    }

    function update() {
        const now = new Date();

        const next = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() + 1,
                0,
                0,
                0
            )
        );

        const diff = next.getTime() - now.getTime();

        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        element.textContent =
            `Próximo puzzle: ` +
            `${String(hours).padStart(2, "0")}:` +
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`;
    }

    update();
    setInterval(update, 1000);
}