import { getLeaderboard } from "./services/api";
import { hideTooltip } from "./ui/tooltip";
import { init } from "./game/gameInit";
import { showLeaderboardModal } from "./ui/leaderboard";
import { updateMuteButton } from "./audio/control";
import {initLoginModal} from "./ui/loginModal";
import {initHelpModal} from "./ui/helpModal";
import {initShareModal} from "./ui/shareModal";
import { startPuzzleCountdown } from "./ui/countdown";

document.addEventListener("click", (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target.closest(".word-chip")) {
        hideTooltip();
    }
});

const leaderboardButton = document.getElementById("leaderboard-btn") as HTMLButtonElement;
leaderboardButton.addEventListener("click", async () => {
    const data = await getLeaderboard()
    showLeaderboardModal(data);
});
startPuzzleCountdown("next-puzzle-countdown");
startPuzzleCountdown("next-puzzle-label");
initLoginModal();
initHelpModal();
initShareModal();
updateMuteButton();
await init();
