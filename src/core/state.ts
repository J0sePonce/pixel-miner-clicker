/**
 * Lógica pura de cálculo y gestión de estado para Pixel Miner Clicker
 * Cero dependencias de DOM/Canvas conforme a las directrices de agentrules.md
 */

import type { GameState, UpgradeItem } from './types';

export interface VeinTierData {
  name: string;
  icon: string;
  maxHealth: number;
  breakBonusMultiplier: number;
  gemColor: string;
}

export const VEIN_TIERS: VeinTierData[] = [
  { name: 'VETA DE COBRE #1', icon: '🥉', maxHealth: 25, breakBonusMultiplier: 15, gemColor: '#d9774a' },
  { name: 'VETA DE HIERRO #2', icon: '⛏️', maxHealth: 50, breakBonusMultiplier: 35, gemColor: '#c2c3c7' },
  { name: 'VETA DE ORO #3', icon: '🪙', maxHealth: 100, breakBonusMultiplier: 80, gemColor: '#ffec27' },
  { name: 'VETA DE AMATISTA #4', icon: '🔮', maxHealth: 200, breakBonusMultiplier: 180, gemColor: '#bd5eff' },
  { name: 'VETA DE DIAMANTE #5', icon: '💎', maxHealth: 400, breakBonusMultiplier: 400, gemColor: '#29adff' },
];

export const INITIAL_UPGRADES: Record<string, UpgradeItem> = {
  wooden_pickaxe: {
    id: 'wooden_pickaxe',
    name: 'Pico de Madera',
    baseCost: 15,
    baseMps: 0.5,
    level: 0,
    icon: '⛏️',
  },
  miner_apprentice: {
    id: 'miner_apprentice',
    name: 'Minero Aprendiz',
    baseCost: 100,
    baseMps: 4.0,
    level: 0,
    icon: '👷',
  },
  steam_drill: {
    id: 'steam_drill',
    name: 'Taladro de Vapor',
    baseCost: 1100,
    baseMps: 32.0,
    level: 0,
    icon: '⚙️',
  },
};

/**
 * Crea el estado inicial por defecto del juego.
 */
export function createInitialState(): GameState {
  const upgrades: Record<string, UpgradeItem> = {};
  for (const [key, item] of Object.entries(INITIAL_UPGRADES)) {
    upgrades[key] = { ...item };
  }

  const initialTier = VEIN_TIERS[0];

  return {
    ore: 0,
    totalOreEarned: 0,
    clickPower: 1,
    mps: 0,
    upgrades,
    lastTickTimestamp: performance.now(),

    // Mecánicas dinámicas de Combo y Fiebre
    feverCharge: 0,
    comboMultiplier: 1.0,
    isFeverActive: false,
    feverRemainingTime: 0,
    lastClickTimestamp: performance.now(),

    // Dureza y progresión de roca
    rockHealth: initialTier.maxHealth,
    rockMaxHealth: initialTier.maxHealth,
    veinTier: 0,
  };
}

/**
 * Fórmula estándar de coste incremental: Coste = CosteBase * (1.15 ^ Nivel)
 */
export function calculateUpgradeCost(baseCost: number, level: number): number {
  return Math.floor(baseCost * Math.pow(1.15, level));
}

export function getUpgradeCurrentCost(upgrade: UpgradeItem): number {
  return calculateUpgradeCost(upgrade.baseCost, upgrade.level);
}

export function canAffordUpgrade(state: GameState, upgradeId: string): boolean {
  const upgrade = state.upgrades[upgradeId];
  if (!upgrade) return false;
  return state.ore >= getUpgradeCurrentCost(upgrade);
}

export function calculateTotalMps(state: GameState): number {
  let total = 0;
  for (const upgrade of Object.values(state.upgrades)) {
    total += upgrade.level * upgrade.baseMps;
  }
  return total;
}

export function buyUpgrade(
  state: GameState,
  upgradeId: string
): { success: boolean; cost?: number; upgrade?: UpgradeItem } {
  const upgrade = state.upgrades[upgradeId];
  if (!upgrade) {
    return { success: false };
  }

  const cost = getUpgradeCurrentCost(upgrade);
  if (state.ore < cost) {
    return { success: false };
  }

  state.ore -= cost;
  upgrade.level += 1;
  state.mps = calculateTotalMps(state);

  return {
    success: true,
    cost,
    upgrade,
  };
}

/**
 * Calcula el multiplicador de combo según la carga actual
 */
function getMultiplierFromCharge(charge: number): number {
  if (charge >= 100) return 5.0;
  if (charge >= 75) return 3.0;
  if (charge >= 50) return 2.0;
  if (charge >= 25) return 1.5;
  return 1.0;
}

export interface ClickResult {
  addedOre: number;
  isCritical: boolean;
  comboMultiplier: number;
  isFever: boolean;
  rockBroken: boolean;
  rockBonusOre: number;
  newTierIndex: number;
}

/**
 * Clic manual con soporte para Puntos Débiles (Golpes Críticos) y acumulación de Fiebre Minera
 */
export function applyManualClickWithBonus(
  state: GameState,
  isCritical: boolean = false
): ClickResult {
  const now = performance.now();
  state.lastClickTimestamp = now;

  // Si está en fiebre, siempre usa x5.0 fijo
  const mult = state.isFeverActive ? 5.0 : state.comboMultiplier;
  const critMult = isCritical ? 5 : 1;
  const addedOre = Math.ceil(state.clickPower * mult * critMult);

  state.ore += addedOre;
  state.totalOreEarned += addedOre;

  // Acumulación de Fiebre Minera si no está activa
  if (!state.isFeverActive) {
    const chargeGain = isCritical ? 20 : 7;
    state.feverCharge = Math.min(100, state.feverCharge + chargeGain);

    if (state.feverCharge >= 100) {
      state.isFeverActive = true;
      state.feverRemainingTime = 8.0; // 8 segundos de fiebre
      state.comboMultiplier = 5.0;
    } else {
      state.comboMultiplier = getMultiplierFromCharge(state.feverCharge);
    }
  }

  // Desgaste de la roca
  const rockDamage = isCritical ? 5 : 1;
  state.rockHealth = Math.max(0, state.rockHealth - rockDamage);

  let rockBroken = false;
  let rockBonusOre = 0;

  if (state.rockHealth <= 0) {
    rockBroken = true;
    const currentTierData = VEIN_TIERS[state.veinTier % VEIN_TIERS.length];
    rockBonusOre = Math.ceil(currentTierData.breakBonusMultiplier * state.clickPower * mult);

    state.ore += rockBonusOre;
    state.totalOreEarned += rockBonusOre;

    // Avanzar a la siguiente veta
    state.veinTier += 1;
    const nextTierData = VEIN_TIERS[state.veinTier % VEIN_TIERS.length];
    state.rockMaxHealth = nextTierData.maxHealth;
    state.rockHealth = nextTierData.maxHealth;
  }

  return {
    addedOre,
    isCritical,
    comboMultiplier: state.comboMultiplier,
    isFever: state.isFeverActive,
    rockBroken,
    rockBonusOre,
    newTierIndex: state.veinTier,
  };
}

/**
 * Actualiza el temporizador de Fiebre y la decadencia por inactividad
 */
export function updateFeverAndCombo(state: GameState, dtSeconds: number): void {
  const now = performance.now();

  if (state.isFeverActive) {
    state.feverRemainingTime -= dtSeconds;
    state.feverCharge = Math.max(0, (state.feverRemainingTime / 8.0) * 100);

    if (state.feverRemainingTime <= 0) {
      state.isFeverActive = false;
      state.feverRemainingTime = 0;
      state.feverCharge = 45; // Desciende a 45% al terminar la sobrecarga
      state.comboMultiplier = getMultiplierFromCharge(state.feverCharge);
    }
  } else {
    // Si han pasado más de 1.2 segundos sin clics, la barra de combo se reduce
    const elapsedSinceClick = (now - state.lastClickTimestamp) / 1000;
    if (elapsedSinceClick > 1.2 && state.feverCharge > 0) {
      const decaySpeed = 16.0; // Puntos por segundo
      state.feverCharge = Math.max(0, state.feverCharge - decaySpeed * dtSeconds);
      state.comboMultiplier = getMultiplierFromCharge(state.feverCharge);
    }
  }
}

/**
 * Avanza la producción pasiva por segundo (MPS).
 * Si la fiebre está activa, la producción pasiva también se multiplica por 2!
 */
export function updateGameTick(state: GameState, dtSeconds: number): { addedOre: number } {
  state.mps = calculateTotalMps(state);

  if (state.mps <= 0 || dtSeconds <= 0) {
    return { addedOre: 0 };
  }

  // Bonus pasivo durante Fiebre Minera
  const mpsMultiplier = state.isFeverActive ? 2.0 : 1.0;
  const addedOre = state.mps * mpsMultiplier * dtSeconds;
  state.ore += addedOre;
  state.totalOreEarned += addedOre;

  return { addedOre };
}
