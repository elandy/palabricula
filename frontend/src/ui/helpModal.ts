export function initHelpModal() {

    const button = document.getElementById("help-btn");
    const modal = document.getElementById("help-modal");
    const close = document.getElementById("close-help");

    if (!button || !modal || !close) {
        return;
    }

    button.addEventListener("click", () => {
        modal.classList.remove("hidden");
    });

    close.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

}