# Estado del Proyecto: Pixel Miner Clicker

## Objetivo
Juego incremental pixel art donde el jugador extrae minerales preciosos haciendo clic en un botón colosal 3D (estilo *Click the Button*) dentro de una caverna viva y cálida, compra picos y mineros automatizados, y participa activamente en el juego con combos de Fiebre Minera, puntos débiles críticos y geodas voladoras.

## Lista de Tareas

### Fases Iniciales (Completadas)
- [x] **Fase 1:** Setup y Estilo Retro Base (Vite, TS estricto, estructura modular).
- [x] **Fase 2:** Core Loop de Clic y Estado (rAF con dt, formateo de números, animaciones base).
- [x] **Fase 3:** Tienda y Sistema de Mejoras (Fórmula exponencial, reactividad en tiempo real).
- [x] **Fase 4:** Persistencia y Audio Retro (localStorage tolerante, Hard Reset, Web Audio API).

### Expansión: Tema Cuevas y Gameloop Dinámico (Completada)
#### Fase A: Rediseño Visual - Tema Cuevas y Botón Colosal 3D
- [x] Implementar paleta cálida de caverna (tonos tierra, piedra caliza, madera de mina reforzada y antorchas).
- [x] Rediseñar el botón central con estética 3D estilo *Click the Button* (profundidad biselada, compresión mecánica pesada).
- [x] Añadir detalles de cueva: antorchas parpadeantes en los laterales y soportes mineros en la interfaz.

#### Fase B: Sistema de Fiebre Minera (Combo) & Puntos Débiles (Weakspots)
- [x] Implementar medidor de Fiebre Minera (Combo Meter) con multiplicadores de racha (x1.5, x2, x3, x5) y decay temporal.
- [x] Desarrollar sistema de Puntos Débiles (*Weakspots*) en la roca que premia la precisión con golpes críticos x5.
- [x] Añadir feedback visual de sobrecarga / fuego al alcanzar la Fiebre Minera.

#### Fase C: Eventos Espontáneos (Geodas Voladoras) & Progresión de Vetas
- [x] Crear barra de dureza y desgaste de la veta mineral con recompensas al romperse y progresión de tiers.
- [x] Implementar evento espontáneo de Geoda Dorada Voladora que cruza la cueva y otorga premios al cazarla.

#### Fase D: Audio Reactivo Tonal, Screen Shake & Pulido Final
- [x] Adaptar Web Audio API para que los golpes sigan una escala tonal pentatónica ascendente según el combo.
- [x] Implementar micro-temblor de pantalla (*Screen Shake*) ante críticos y rupturas de roca.
- [x] Verificar compilación estricta con `npm run build` y validar experiencia en navegador.

#### Fase E: Hard Reset In-Game Modal & Servidor Local
- [x] Reemplazar `window.confirm` por modal nativo pixel art con animación y confirmación interactiva.
- [x] Añadir sistema de notificación flotante (Toast) para eventos de reseteo.
- [x] Configurar `base: './'` en Vite para garantizar compatibilidad de rutas relativas.
- [x] Servidor Vite en ejecución y validado con browser subagent.

#### Fase F: Preparación para GitHub Pages
- [x] Crear [.gitignore](file:///c:/Users/josea/Downloads/prueba/.gitignore) para proteger el repositorio de `node_modules` y builds locales.
- [x] Configurar GitHub Actions en [.github/workflows/deploy.yml](file:///c:/Users/josea/Downloads/prueba/.github/workflows/deploy.yml) para despliegue automático en GitHub Pages.

---

## Punto de Retorno (Checkpoint)
- **Último archivo modificado:** `.gitignore`, `.github/workflows/deploy.yml`, `project-state.md`.
- **Siguiente acción inmediata:** Proyecto listo para publicar en GitHub Pages.