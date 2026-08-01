import { initGoogleLogin } from "../auth/google";

export function updateAuthButtons() {
    const loginButton = document.getElementById("login-btn") as HTMLButtonElement | null;
    const logoutButton = document.getElementById("logout-btn") as HTMLButtonElement | null;
    const isGoogleUser = localStorage.getItem("auth_provider") === "google";
    if (loginButton) {
        loginButton.classList.toggle("hidden", isGoogleUser);
    }
    if (logoutButton) {
        logoutButton.classList.toggle("hidden", !isGoogleUser);
    }
}

export function initLoginModal() {
    const loginButton = document.getElementById("login-btn");
    const logoutButton = document.getElementById("logout-btn");
    const modal = document.getElementById("login-modal");
    const close = document.getElementById("close-login");

    if (!loginButton || !logoutButton || !modal || !close) {
        return;
    }
    updateAuthButtons();

    loginButton.addEventListener(
        "click",
        async () => {
            modal.classList.remove("hidden");

            await initGoogleLogin(
                "google-login-main",
                () => {
                    location.reload();
                }
            );
        }
    );

    logoutButton.addEventListener(
        "click",
        () => {
            localStorage.removeItem("auth_provider");
            localStorage.removeItem("player_id");
            localStorage.removeItem("username");
            localStorage.removeItem("session_id");
            localStorage.removeItem("session_puzzle_id");
            localStorage.removeItem("browser_id");

            location.reload();
        }
    );

    close.addEventListener(
        "click",
        () => {
            modal.classList.add(
                "hidden"
            );
        }
    );
}