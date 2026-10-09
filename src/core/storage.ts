/**
 * Módulo de almacenamiento y persistencia para Pixel Miner Clicker
 * Cero dependencias de DOM/Canvas conforme a agentrules.md
 */

import { createInitialState, calculateTotalMps, INITIAL_UPGRADES, VEIN_TIERS } from './state';
import type { GameState, UpgradeItem } from './types';

export const SAVE_KEY = 'pixel_miner_save_v1';

/**
 * Guarda el estado actual en localStorage de forma segura.
 */
export function saveGameToStorage(state: GameState): boolean {
  try {
    const serialized = JSON.stringify({
      ore: state.ore,
      totalOreEarned: state.totalOreEarned,
      clickPower: state.clickPower,
      upgrades: state.upgrades,
      veinTier: state.veinTier,
      rockHealth: state.rockHealth,
      savedAt: Date.now(),
    });
    localStorage.setItem(SAVE_KEY, serialized);
    return true;
  } catch (error) {
    console.warn('[Storage] Error al guardar la partida:', error);
    return false;
  }
}

/**
 * Carga el estado de localStorage con tolerancia estricta a fallos.
 * Si el JSON está corrupto o desactualizado, se repara o inicializa por defecto sin romper la app.
 */
export function loadGameFromStorage(): GameState {
  const fallbackState = createInitialState();

  try {
    const rawData = localStorage.getItem(SAVE_KEY);
    if (!rawData) {
      return fallbackState;
    }

    const parsed = JSON.parse(rawData);

    // Validación de integridad básica
    if (!parsed || typeof parsed !== 'object') {
      console.warn('[Storage] Datos de guardado no válidos. Reestableciendo valores por defecto.');
      return fallbackState;
    }

    const ore = typeof parsed.ore === 'number' && !isNaN(parsed.ore) && parsed.ore >= 0
      ? parsed.ore
      : 0;

    const totalOreEarned = typeof parsed.totalOreEarned === 'number' && !isNaN(parsed.totalOreEarned) && parsed.totalOreEarned >= ore
      ? parsed.totalOreEarned
      : ore;

    const clickPower = typeof parsed.clickPower === 'number' && parsed.clickPower >= 1
      ? parsed.clickPower
      : 1;

    // Fusión de mejoras asegurando que existan todas las del catálogo base
    const loadedUpgrades = parsed.upgrades && typeof parsed.upgrades === 'object'
      ? parsed.upgrades
      : {};

    const mergedUpgrades: Record<string, UpgradeItem> = {};

    for (const [key, baseItem] of Object.entries(INITIAL_UPGRADES)) {
      const savedItem = loadedUpgrades[key];
      const level = savedItem && typeof savedItem.level === 'number' && !isNaN(savedItem.level) && savedItem.level >= 0
        ? Math.floor(savedItem.level)
        : 0;

      mergedUpgrades[key] = {
        ...baseItem,
        level,
      };
    }

    const veinTier = typeof parsed.veinTier === 'number' && parsed.veinTier >= 0
      ? Math.floor(parsed.veinTier)
      : 0;

    const tierData = VEIN_TIERS[veinTier % VEIN_TIERS.length];
    const rockHealth = typeof parsed.rockHealth === 'number' && parsed.rockHealth > 0 && parsed.rockHealth <= tierData.maxHealth
      ? Math.floor(parsed.rockHealth)
      : tierData.maxHealth;

    const loadedState: GameState = {
      ore,
      totalOreEarned,
      clickPower,
      mps: 0,
      upgrades: mergedUpgrades,
      lastTickTimestamp: performance.now(),

      // Valores seguros para variables de sesión activa
      feverCharge: 0,
      comboMultiplier: 1.0,
      isFeverActive: false,
      feverRemainingTime: 0,
      lastClickTimestamp: performance.now(),

      veinTier,
      rockHealth,
      rockMaxHealth: tierData.maxHealth,
    };

    // Recalcular MPS correcto con los niveles restaurados
    loadedState.mps = calculateTotalMps(loadedState);

    return loadedState;
  } catch (error) {
    console.warn('[Storage] Error al parsear el guardado de localStorage:', error);
    return fallbackState;
  }
}

/**
 * Borra el guardado actual y devuelve un nuevo estado limpio (Hard Reset).
 */
export function clearGameStorage(): GameState {
  const freshState = createInitialState();
  try {
    localStorage.removeItem(SAVE_KEY);
    saveGameToStorage(freshState);
  } catch (error) {
    console.warn('[Storage] Error al limpiar localStorage:', error);
  }
  return freshState;
}
