export function spawnWordAnimation(text: string, type: string) {
    const el = document.createElement("div");
    el.textContent = text;
    el.className = `floating-word ${type}`;

    const currentWordEl = document.getElementById("current-word");
    if (currentWordEl) {
        const rect = currentWordEl.getBoundingClientRect();
        el.style.left = `${rect.left + rect.width / 2}px`;
        el.style.top = `${rect.top + rect.height / 2}px`;
    }

    document.body.appendChild(el);
    void el.offsetWidth;
    // trigger animation
    requestAnimationFrame(() => {
        el.classList.add("active");
    });
    el.addEventListener("animationend", () => {
        el.remove();
    });
}