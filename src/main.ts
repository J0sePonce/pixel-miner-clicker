import './style.css';
import {
  applyManualClickWithBonus,
  updateGameTick,
  updateFeverAndCombo,
  buyUpgrade,
  VEIN_TIERS,
} from './core/state';
import { loadGameFromStorage, saveGameToStorage, clearGameStorage } from './core/storage';
import { GameUI } from './ui/renderer';
import { RetroAudio } from './ui/audio';
import type { GameState } from './core/types';

// Cargar estado inicial desde persistencia local (o fallback tolerante a fallos)
let gameState: GameState = loadGameFromStorage();
const ui = new GameUI();
const audio = new RetroAudio();

// Sincronizar estado inicial de sonido
ui.updateMuteButton(audio.getIsMuted());

// Manejador de compra de mejoras pasivas
function handleBuyUpgrade(upgradeId: string): void {
  const result = buyUpgrade(gameState, upgradeId);
  if (result.success) {
    audio.playBuySuccess();
    ui.triggerPurchaseFeedback(upgradeId);
    ui.updateHUD(gameState);
    ui.updateShop(gameState);
    saveGameToStorage(gameState);
  }
}

// Inicializar componentes visuales
ui.updateHUD(gameState);
ui.initShop(gameState, handleBuyUpgrade);

/**
 * Procesa un golpe crítico cuando el jugador hace clic en un punto débil (Weakspot)
 */
function handleWeakspotHit(): void {
  const result = applyManualClickWithBonus(gameState, true);

  audio.playCriticalHit();
  ui.triggerScreenShake();
  ui.triggerMineSquash();

  const buttonEl = ui.getMineButton();
  const rect = buttonEl?.getBoundingClientRect();
  const clickX = rect ? rect.left + rect.width / 2 : 200;
  const clickY = rect ? rect.top + rect.height / 2 : 200;

  ui.spawnClickFeedback(result.addedOre, clickX, clickY, true, result.isFever);

  if (result.rockBroken) {
    audio.playRockBreak();
    const tierData = VEIN_TIERS[result.newTierIndex % VEIN_TIERS.length];
    ui.triggerRockBreakFeedback(result.rockBonusOre, tierData.name);
  }

  ui.updateHUD(gameState);
  ui.updateShop(gameState);
}

// 1. Configuración de la interacción manual con el Botón Colosal 3D
const mineButton = ui.getMineButton();
if (mineButton) {
  mineButton.addEventListener('click', (event: MouseEvent) => {
    // Clic regular con multiplicador de combo
    const result = applyManualClickWithBonus(gameState, false);

    // Audio reactivo a la escala de combo
    audio.playMineHit(result.comboMultiplier);
    ui.triggerMineSquash();
    ui.spawnClickFeedback(result.addedOre, event.clientX, event.clientY, false, result.isFever);

    // Probabilidad de generar un punto débil brillante (Weakspot) si no hay uno activo
    if (Math.random() < 0.22) {
      ui.spawnWeakspot(() => {
        handleWeakspotHit();
      });
    }

    // Comprobar si se rompe la roca
    if (result.rockBroken) {
      audio.playRockBreak();
      const tierData = VEIN_TIERS[result.newTierIndex % VEIN_TIERS.length];
      ui.triggerRockBreakFeedback(result.rockBonusOre, tierData.name);
    }

    ui.updateHUD(gameState);
    ui.updateShop(gameState);
  });
}

// 2. Control de Audio Mute/Unmute
const muteButton = ui.getMuteButton();
if (muteButton) {
  muteButton.addEventListener('click', () => {
    const isMuted = audio.toggleMute();
    ui.updateMuteButton(isMuted);
  });
}

// 3. Botón y Modal de Hard Reset (confirmación pixel art en pantalla)
ui.initResetModal(() => {
  gameState = clearGameStorage();
  audio.playResetSound();
  ui.clearWeakspots();
  ui.updateHUD(gameState);
  ui.initShop(gameState, handleBuyUpgrade);
  ui.flashSaveIndicator();
  ui.showToast('¡PARTIDA REINICIADA DESDE CERO!');
});

const resetButton = ui.getResetButton();
if (resetButton) {
  resetButton.addEventListener('click', () => {
    ui.openResetModal();
  });
}

// 4. Auto-guardado periódico cada 6 segundos y en beforeunload
const SAVE_INTERVAL_MS = 6000;
setInterval(() => {
  if (saveGameToStorage(gameState)) {
    ui.flashSaveIndicator();
  }
}, SAVE_INTERVAL_MS);

window.addEventListener('beforeunload', () => {
  saveGameToStorage(gameState);
});

// 5. Temporizador para Geodas Doradas Voladoras (evento espontáneo cada 30-45s)
let timeUntilNextGeode = 25.0;

// 6. Bucle de tiempo desacoplado con requestAnimationFrame y delta time (dt)
let lastTimestamp = performance.now();

function gameLoop(currentTimestamp: number): void {
  const dtSeconds = Math.min((currentTimestamp - lastTimestamp) / 1000, 1.0);
  lastTimestamp = currentTimestamp;

  // Actualización de producción pasiva en el núcleo
  updateGameTick(gameState, dtSeconds);

  // Decaimiento del combo y temporizador de Fiebre Minera
  updateFeverAndCombo(gameState, dtSeconds);

  // Gestión del spawn de la Geoda Dorada
  timeUntilNextGeode -= dtSeconds;
  if (timeUntilNextGeode <= 0) {
    timeUntilNextGeode = 30.0 + Math.random() * 20.0;
    ui.spawnGoldenGeodeFlyer((bonusOre) => {
      gameState.ore += bonusOre;
      gameState.totalOreEarned += bonusOre;
      audio.playCriticalHit();
      ui.updateHUD(gameState);
      ui.updateShop(gameState);
    });
  }

  // Actualización visual frame a frame
  ui.updateHUD(gameState);
  ui.updateShop(gameState);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

console.log('[Pixel Miner Clicker] Expansión activa: Fiebre Minera, Weakspots y Geodas Voladoras en marcha.');
