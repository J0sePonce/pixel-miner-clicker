/**
 * Tipos base para el núcleo de cálculo de Pixel Miner Clicker
 * Libre de dependencias con DOM o Canvas según agentrules.md
 */

export interface UpgradeItem {
  id: string;
  name: string;
  baseCost: number;
  baseMps: number;
  level: number;
  icon: string;
}

export interface GameState {
  ore: number;
  totalOreEarned: number;
  clickPower: number;
  mps: number;
  upgrades: Record<string, UpgradeItem>;
  lastTickTimestamp: number;

  // Mecánicas dinámicas de Fiebre y Combo (Fase B)
  feverCharge: number;         // 0 a 100
  comboMultiplier: number;     // 1.0, 1.5, 2.0, 3.0, 5.0
  isFeverActive: boolean;
  feverRemainingTime: number;  // segundos
  lastClickTimestamp: number;

  // Progresión y Dureza de Veta (Fase C)
  rockHealth: number;
  rockMaxHealth: number;
  veinTier: number;            // 0: Cobre, 1: Hierro, 2: Oro, 3: Amatista, 4: Diamante
}
