import {
    loginBrowser,
    setPlayerName,
} from "../services/api";
import {ApiError, PlayerIdentityResponse} from "../types/api";
import {initGoogleLogin} from "../auth/google";

function getOrCreateBrowserId(): string {
    let browserId = localStorage.getItem("browser_id");

    if (!browserId) {
        browserId = crypto.randomUUID();
        localStorage.setItem("browser_id", browserId);
    }

    return browserId;
}

export async function askUsername(): Promise<PlayerIdentityResponse> {
    return new Promise((resolve) => {
        let currentPlayerId: string | null = null;

        const modal = document.getElementById("username-modal") as HTMLDivElement;
        const input = document.getElementById("username-input") as HTMLInputElement;
        const button = document.getElementById("username-submit") as HTMLButtonElement;
        const error = document.getElementById("username-error") as HTMLDivElement;
        const googleLoginContainer = document.getElementById("google-login-username") as HTMLDivElement | null;
        const googleLoginText = googleLoginContainer?.previousElementSibling as HTMLElement | null;

        modal.classList.remove("hidden");
        input.focus();

        async function submit() {
            const username = input.value.trim();
            if (!username) return;

            error.textContent = "";
            if (!/^[A-Za-z0-9]{4,25}$/.test(username)) {
                error.textContent = "El nombre debe tener entre 4 y 25 caracteres alfanuméricos.";
                return;
            }
            try {
                if (!currentPlayerId) {
                    const browserPlayer = await loginBrowser(getOrCreateBrowserId());
                    currentPlayerId = browserPlayer.player_id;
                }
                const player = await setPlayerName(currentPlayerId, username);

                modal.classList.add("hidden");

                localStorage.setItem("player_id", player.id);
                localStorage.setItem("username", player.username);

                resolve({
                    player_id: player.id,
                    username: player.username,
                });
            } catch (err) {
                const apiError = err as ApiError;
                error.textContent = apiError.detail ?? "Nombre no disponible";
            }
        }

        button.onclick = submit;
        input.onkeydown = (e) => {
            if (e.key === "Enter") submit();
        };

        initGoogleLogin(
            "google-login-username",
            (player) => {
                currentPlayerId = player.player_id;
                localStorage.setItem("player_id", player.player_id);
                localStorage.setItem("auth_provider", "google");

                if (player.username) {
                    localStorage.setItem("username", player.username);
                    modal.classList.add("hidden");
                    resolve({
                        player_id: player.player_id,
                        username: player.username,
                    });

                    return;
                }

                localStorage.removeItem("username");

                if (googleLoginContainer) {
                    googleLoginContainer.classList.add("hidden");
                    googleLoginContainer.innerHTML = "";
                }

                if (googleLoginText) {
                    googleLoginText.textContent = "Google conectado.";
                }

                error.textContent = "Ahora elige un nombre de usuario.";
                input.focus();
            }
        );

    });
}