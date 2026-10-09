---
trigger: always_on
---

# Directrices de Desarrollo: Videojuego Incremental Pixel Art

## 1. Stack y Arquitectura
- Entorno: Vite + TypeScript (Vanilla, sin frameworks pesados).
- Separación de responsabilidades:
  - `src/core/`: Lógica pura de cálculo (estado, producción pasiva, multiplicadores, guardado). Cero dependencias de DOM/Canvas.
  - `src/ui/`: Renderizado visual, manejo de eventos de clic y animaciones.
- Estilo visual: Estética pixel art retro. Uso estricto de `image-rendering: pixelated` en CSS o dibujado sobre un `<canvas>` con resolución nativa baja reescalada (ej. 320x240 o 640x360).

## 2. Fórmulas y Matemáticas Incrementales
- Modelo de costes estándar: `Coste = CosteBase * (1.15 ^ Nivel)`.
- Bucle de tiempo: Usa `requestAnimationFrame` con cálculo de tiempo delta (`dt = timestamp - lastTime`) para desacoplar la producción por segundo de la tasa de refresco del monitor.
- Formateo de números: Implementa una utilidad para abreviar cifras grandes (`1K`, `1.5M`, `2.3B`, `10T`).

## 3. Persistencia y Almacenamiento
- Guardado local automático en `localStorage` cada 5 o 10 segundos y en el evento `beforeunload`.
- Tolerancia a fallos: Si el JSON guardado está corrupto o desactualizado, el juego debe reinicializarse con valores por defecto sin romper la pantalla.

## 4. Reglas Operativas en el IDE
- Comprobación inmediata tras cada cambio: ejecuta `npm run build` para asegurar tipado TypeScript estricto.
- No uses librerías externas de motores de juego (Phaser, Pixi) salvo petición explícita; mantén el código liviano con APIs nativas de la web.
- Actualiza `project-state.md` antes de cambiar de fase.