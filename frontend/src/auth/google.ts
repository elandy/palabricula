import { APP_CONFIG } from "../config";
import { loginGoogle } from "../services/api";
import { PlayerIdentityResponse } from "../types/api";

declare global {
    interface Window {
        google: any;
    }
}

export async function initGoogleLogin(
    containerId: string,
    onSuccess: (player: PlayerIdentityResponse) => void
) {
    if (!window.google?.accounts?.id) {
        console.error(
            "Google Identity Services not loaded"
        );
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(
            `Google container ${containerId} not found`
        );
        return;
    }

    window.google.accounts.id.initialize({
        client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
        callback: async (
            response: any
        ) => {
            const currentPlayerId = localStorage.getItem("player_id");
            const player =
                await loginGoogle(
                    response.credential,
                    currentPlayerId
                );

            localStorage.setItem("player_id", player.player_id);
            localStorage.setItem("auth_provider", "google");

            if (player.username) {
                localStorage.setItem(
                    "username",
                    player.username
                );
            } else {
                localStorage.removeItem("username");
            }

            onSuccess(player);
        },
    });


    container.innerHTML = "";


    window.google.accounts.id.renderButton(
        container,
        {
            theme: "outline",
            size: "large",
            text: "continue_with",
        }
    );
}