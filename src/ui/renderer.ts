/**
 * Módulo de renderizado y feedback visual para Pixel Miner Clicker
 * Responsable de la manipulación del DOM, eventos visuales, HUD, Tienda,
 * Fiebre Minera, Puntos Débiles (Weakspots) y Ruptura de Roca.
 */

import { formatNumber } from '../core/format';
import { getUpgradeCurrentCost, canAffordUpgrade, VEIN_TIERS } from '../core/state';
import type { GameState } from '../core/types';

interface ShopItemDomRefs {
  container: HTMLElement;
  costEl: HTMLElement;
  levelText: HTMLElement;
  buyBtn: HTMLButtonElement;
}

export class GameUI {
  private miningStageEl: HTMLElement | null;
  private oreCountEl: HTMLElement | null;
  private mpsCountEl: HTMLElement | null;
  private mineButton: HTMLButtonElement | null;
  private feedbackLayer: HTMLElement | null;
  private shopListEl: HTMLElement | null;
  private shopRefs: Map<string, ShopItemDomRefs> = new Map();
  private saveIndicatorEl: HTMLElement | null;
  private muteBtn: HTMLButtonElement | null;
  private muteIconEl: HTMLElement | null;
  private resetBtn: HTMLButtonElement | null;

  // Nuevos elementos para Fiebre Minera y Progresión
  private feverProgressBar: HTMLElement | null;
  private comboMultiplierBadge: HTMLElement | null;
  private rockHealthBar: HTMLElement | null;
  private rockHealthText: HTMLElement | null;
  private veinNameEl: HTMLElement | null;
  private weakspotLayer: HTMLElement | null;
  private floatingEventsLayer: HTMLElement | null;
  private oreGemEl: HTMLElement | null;

  private resetModalEl: HTMLElement | null;
  private modalConfirmBtn: HTMLButtonElement | null;
  private modalCancelBtn: HTMLButtonElement | null;
  private toastLayerEl: HTMLElement | null;

  private currentWeakspotEl: HTMLElement | null = null;
  private weakspotTimeoutId: number | null = null;

  constructor() {
    this.miningStageEl = document.getElementById('mining-stage');
    this.oreCountEl = document.getElementById('ore-count');
    this.mpsCountEl = document.getElementById('mps-count');
    this.mineButton = document.getElementById('mine-button') as HTMLButtonElement | null;
    this.feedbackLayer = document.getElementById('click-feedback-layer');
    this.shopListEl = document.getElementById('shop-list');
    this.saveIndicatorEl = document.getElementById('save-indicator');
    this.muteBtn = document.getElementById('mute-btn') as HTMLButtonElement | null;
    this.muteIconEl = document.getElementById('mute-icon');
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement | null;

    this.feverProgressBar = document.getElementById('fever-progress-bar');
    this.comboMultiplierBadge = document.getElementById('combo-multiplier-badge');
    this.rockHealthBar = document.getElementById('rock-health-bar');
    this.rockHealthText = document.getElementById('rock-health-text');
    this.veinNameEl = document.getElementById('vein-name');
    this.weakspotLayer = document.getElementById('weakspot-layer');
    this.floatingEventsLayer = document.getElementById('floating-events-layer');
    this.oreGemEl = document.getElementById('ore-gem-element');

    this.resetModalEl = document.getElementById('reset-modal');
    this.modalConfirmBtn = document.getElementById('modal-confirm-btn') as HTMLButtonElement | null;
    this.modalCancelBtn = document.getElementById('modal-cancel-btn') as HTMLButtonElement | null;
    this.toastLayerEl = document.getElementById('toast-layer');
  }

  /**
   * Actualiza los marcadores del HUD, medidor de fiebre y dureza de roca
   */
  public updateHUD(state: GameState): void {
    if (this.oreCountEl) {
      this.oreCountEl.textContent = formatNumber(Math.floor(state.ore));
    }
    if (this.mpsCountEl) {
      const activeMps = state.isFeverActive ? state.mps * 2 : state.mps;
      this.mpsCountEl.textContent = `${formatNumber(activeMps, 1)} /s`;
    }

    // Actualizar barra y multiplicador de Fiebre Minera
    if (this.feverProgressBar) {
      const percent = Math.min(100, Math.max(0, state.feverCharge));
      this.feverProgressBar.style.width = `${percent}%`;
      this.feverProgressBar.classList.toggle('is-max', state.isFeverActive);
    }

    if (this.comboMultiplierBadge) {
      const mult = state.isFeverActive ? 5.0 : state.comboMultiplier;
      this.comboMultiplierBadge.textContent = state.isFeverActive ? '🔥 x5.0 FIEBRE' : `x${mult.toFixed(1)}`;
      this.comboMultiplierBadge.classList.toggle('hot', mult > 1.0 || state.isFeverActive);
    }

    // Botón resplandeciente en modo Fiebre
    if (this.mineButton) {
      this.mineButton.classList.toggle('fever-glow', state.isFeverActive);
    }

    // Actualizar barra de salud de la roca
    if (this.rockHealthBar && state.rockMaxHealth > 0) {
      const healthPercent = Math.min(100, Math.max(0, (state.rockHealth / state.rockMaxHealth) * 100));
      this.rockHealthBar.style.width = `${healthPercent}%`;
    }

    if (this.rockHealthText) {
      this.rockHealthText.textContent = `${state.rockHealth} / ${state.rockMaxHealth}`;
    }

    // Actualizar nombre y color de la gema según el tier
    const currentTier = VEIN_TIERS[state.veinTier % VEIN_TIERS.length];
    if (this.veinNameEl) {
      this.veinNameEl.textContent = `${currentTier.name}`;
    }

    if (this.oreGemEl) {
      const facetLight = this.oreGemEl.querySelector('.gem-facet.f-light') as HTMLElement | null;
      if (facetLight) {
        facetLight.style.backgroundColor = currentTier.gemColor;
      }
    }
  }

  /**
   * Genera un punto débil brillante en una posición aleatoria de la roca
   */
  public spawnWeakspot(onHit: () => void): void {
    if (!this.weakspotLayer || !this.mineButton) return;

    // Si ya hay un punto débil activo, limpiarlo
    this.clearWeakspots();

    const buttonRect = this.mineButton.getBoundingClientRect();
    const layerRect = this.weakspotLayer.getBoundingClientRect();

    // Posición aleatoria dentro del área del botón (área segura central de 30% a 70%)
    const offsetX = buttonRect.left - layerRect.left + buttonRect.width * (0.28 + Math.random() * 0.44);
    const offsetY = buttonRect.top - layerRect.top + buttonRect.height * (0.28 + Math.random() * 0.44);

    const weakspot = document.createElement('div');
    weakspot.className = 'weakspot-target';
    weakspot.style.left = `${offsetX - 17}px`;
    weakspot.style.top = `${offsetY - 17}px`;

    const crosshair = document.createElement('div');
    crosshair.className = 'weakspot-crosshair';
    weakspot.appendChild(crosshair);

    weakspot.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      this.clearWeakspots();
      onHit();
    });

    this.weakspotLayer.appendChild(weakspot);
    this.currentWeakspotEl = weakspot;

    // Desaparece tras 3.2 segundos si no se pulsa
    this.weakspotTimeoutId = window.setTimeout(() => {
      this.clearWeakspots();
    }, 3200);
  }

  public clearWeakspots(): void {
    if (this.weakspotTimeoutId) {
      clearTimeout(this.weakspotTimeoutId);
      this.weakspotTimeoutId = null;
    }
    if (this.currentWeakspotEl) {
      this.currentWeakspotEl.remove();
      this.currentWeakspotEl = null;
    }
  }

  /**
   * Genera una Geoda Dorada Voladora que cruza la caverna (Fase C)
   */
  public spawnGoldenGeodeFlyer(onCatch: (bonus: number) => void): void {
    if (!this.floatingEventsLayer) return;

    const layerWidth = this.floatingEventsLayer.clientWidth || 600;
    const layerHeight = this.floatingEventsLayer.clientHeight || 400;

    const flyer = document.createElement('div');
    flyer.className = 'golden-geode-flyer';
    flyer.textContent = '✨';

    const startY = 40 + Math.random() * (layerHeight - 120);
    flyer.style.top = `${startY}px`;
    flyer.style.left = '-50px';

    this.floatingEventsLayer.appendChild(flyer);

    let progress = 0;
    const durationMs = 6000;
    const startTime = performance.now();

    const animate = (now: number) => {
      if (!flyer.isConnected) return;

      progress = (now - startTime) / durationMs;
      if (progress >= 1.0) {
        flyer.remove();
        return;
      }

      const x = -50 + progress * (layerWidth + 100);
      const waveY = startY + Math.sin(progress * Math.PI * 4) * 25;
      flyer.style.left = `${x}px`;
      flyer.style.top = `${waveY}px`;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    flyer.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      flyer.remove();

      // Bonificación especial
      onCatch(50);
      this.spawnClickFeedback(50, e.clientX, e.clientY, true, true);
    });
  }

  /**
   * Sacudida de pantalla (Screen Shake) ante impactos potentes
   */
  public triggerScreenShake(): void {
    if (!this.miningStageEl) return;

    this.miningStageEl.classList.remove('screen-shake');
    void this.miningStageEl.offsetWidth;
    this.miningStageEl.classList.add('screen-shake');
  }

  /**
   * Inicializa la lista dinámica de la tienda de mejoras en el DOM
   */
  public initShop(state: GameState, onBuy: (upgradeId: string) => void): void {
    if (!this.shopListEl) return;

    this.shopListEl.innerHTML = '';
    this.shopRefs.clear();

    for (const upgrade of Object.values(state.upgrades)) {
      const itemEl = document.createElement('div');
      itemEl.className = 'shop-item pixel-box';
      itemEl.dataset.upgradeId = upgrade.id;

      const iconBox = document.createElement('div');
      iconBox.className = 'item-icon-box';
      iconBox.textContent = upgrade.icon;

      const detailsBox = document.createElement('div');
      detailsBox.className = 'item-details';

      const nameEl = document.createElement('div');
      nameEl.className = 'item-name';
      nameEl.textContent = upgrade.name;

      const benefitEl = document.createElement('div');
      benefitEl.className = 'item-benefit';
      benefitEl.textContent = `+${upgrade.baseMps.toFixed(1)} /s`;

      const costEl = document.createElement('div');
      costEl.className = 'item-cost';
      const cost = getUpgradeCurrentCost(upgrade);
      costEl.textContent = `Coste: ${formatNumber(cost)} 💎`;

      detailsBox.appendChild(nameEl);
      detailsBox.appendChild(benefitEl);
      detailsBox.appendChild(costEl);

      const buyBtn = document.createElement('button');
      buyBtn.className = 'buy-btn pixel-button';
      buyBtn.type = 'button';
      buyBtn.textContent = `NIV. ${upgrade.level}`;
      buyBtn.disabled = !canAffordUpgrade(state, upgrade.id);

      buyBtn.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        onBuy(upgrade.id);
      });

      itemEl.appendChild(iconBox);
      itemEl.appendChild(detailsBox);
      itemEl.appendChild(buyBtn);

      this.shopListEl.appendChild(itemEl);

      this.shopRefs.set(upgrade.id, {
        container: itemEl,
        costEl,
        levelText: buyBtn,
        buyBtn,
      });
    }

    this.updateShop(state);
  }

  public updateShop(state: GameState): void {
    for (const [id, refs] of this.shopRefs.entries()) {
      const upgrade = state.upgrades[id];
      if (!upgrade) continue;

      const cost = getUpgradeCurrentCost(upgrade);
      const canAfford = state.ore >= cost;

      refs.costEl.textContent = `Coste: ${formatNumber(cost)} 💎`;
      refs.levelText.textContent = `NIV. ${upgrade.level}`;

      refs.buyBtn.disabled = !canAfford;
      refs.buyBtn.classList.toggle('is-affordable', canAfford);
    }
  }

  public triggerPurchaseFeedback(upgradeId: string): void {
    const refs = this.shopRefs.get(upgradeId);
    if (!refs) return;

    refs.container.classList.remove('purchase-flash');
    void refs.container.offsetWidth;
    refs.container.classList.add('purchase-flash');
  }

  public triggerMineSquash(): void {
    if (!this.mineButton) return;

    this.mineButton.classList.remove('is-clicking');
    void this.mineButton.offsetWidth;
    this.mineButton.classList.add('is-clicking');

    setTimeout(() => {
      this.mineButton?.classList.remove('is-clicking');
    }, 90);
  }

  /**
   * Genera el número flotante retro y chispas pixeladas
   */
  public spawnClickFeedback(
    amount: number,
    clientX: number,
    clientY: number,
    isCritical: boolean = false,
    isFever: boolean = false
  ): void {
    if (!this.feedbackLayer) return;

    const layerRect = this.feedbackLayer.getBoundingClientRect();
    const x = clientX - layerRect.left;
    const y = clientY - layerRect.top;

    const floater = document.createElement('span');
    floater.className = `floating-number ${isCritical ? 'critical' : ''}`;

    if (isCritical) {
      floater.textContent = `¡CRÍTICO! +${formatNumber(amount)} 💎`;
    } else if (isFever) {
      floater.textContent = `🔥 +${formatNumber(amount)} 💎`;
    } else {
      floater.textContent = `+${formatNumber(amount)}`;
    }

    floater.style.left = `${x}px`;
    floater.style.top = `${y}px`;
    this.feedbackLayer.appendChild(floater);

    setTimeout(() => {
      floater.remove();
    }, 850);

    // Partículas de impacto
    const particleColors = isCritical
      ? ['#ff004d', '#ffec27', '#ffffff', '#ffa300']
      : ['#ffec27', '#ffa300', '#fff1e8', '#ab5236'];

    const particleCount = isCritical ? 9 : 5;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'click-particle';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.backgroundColor = particleColors[i % particleColors.length];

      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const distance = (isCritical ? 35 : 20) + Math.random() * 25;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      particle.style.setProperty('--p-dx', `${dx}px`);
      particle.style.setProperty('--p-dy', `${dy}px`);

      this.feedbackLayer.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 450);
    }
  }

  /**
   * Feedback cuando la roca se rompe por completo
   */
  public triggerRockBreakFeedback(bonusOre: number, newTierName: string): void {
    this.triggerScreenShake();

    if (!this.feedbackLayer) return;

    const banner = document.createElement('span');
    banner.className = 'floating-number critical';
    banner.textContent = `¡VETA ROTA! +${formatNumber(bonusOre)} 💎 → ${newTierName}`;
    banner.style.left = '50%';
    banner.style.top = '50%';
    banner.style.transform = 'translate(-50%, -50%)';

    this.feedbackLayer.appendChild(banner);

    setTimeout(() => {
      banner.remove();
    }, 1200);
  }

  public getMineButton(): HTMLButtonElement | null {
    return this.mineButton;
  }

  public getMuteButton(): HTMLButtonElement | null {
    return this.muteBtn;
  }

  public getResetButton(): HTMLButtonElement | null {
    return this.resetBtn;
  }

  public updateMuteButton(isMuted: boolean): void {
    if (this.muteIconEl) {
      this.muteIconEl.textContent = isMuted ? '🔇' : '🔊';
    }
  }

  public flashSaveIndicator(): void {
    if (!this.saveIndicatorEl) return;

    this.saveIndicatorEl.classList.add('saving');
    this.saveIndicatorEl.textContent = '💾 GUARDADO OK';

    setTimeout(() => {
      if (this.saveIndicatorEl) {
        this.saveIndicatorEl.classList.remove('saving');
        this.saveIndicatorEl.textContent = '● GUARDADO LOCAL';
      }
    }, 1200);
  }

  /**
   * Inicializa los listeners para la ventana modal de confirmación de Hard Reset
   */
  public initResetModal(onConfirm: () => void): void {
    if (this.modalConfirmBtn) {
      this.modalConfirmBtn.addEventListener('click', () => {
        this.closeResetModal();
        onConfirm();
      });
    }

    if (this.modalCancelBtn) {
      this.modalCancelBtn.addEventListener('click', () => {
        this.closeResetModal();
      });
    }

    if (this.resetModalEl) {
      this.resetModalEl.addEventListener('click', (e: MouseEvent) => {
        if (e.target === this.resetModalEl) {
          this.closeResetModal();
        }
      });
    }

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isResetModalOpen()) {
        this.closeResetModal();
      }
    });
  }

  public openResetModal(): void {
    if (this.resetModalEl) {
      this.resetModalEl.classList.remove('hidden');
    }
  }

  public closeResetModal(): void {
    if (this.resetModalEl) {
      this.resetModalEl.classList.add('hidden');
    }
  }

  public isResetModalOpen(): boolean {
    return !!this.resetModalEl && !this.resetModalEl.classList.contains('hidden');
  }

  /**
   * Muestra un mensaje flotante tipo Toast retro
   */
  public showToast(message: string): void {
    if (!this.toastLayerEl) return;

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;

    this.toastLayerEl.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2400);
  }
}

