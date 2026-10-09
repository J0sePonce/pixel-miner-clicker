---
description: Verifica compilación, arranca el servidor Vite y comprueba la reactividad de clics, mejoras y guardado.
---

# Procedimiento de Verificación del Juego

## 1. Verificación de Tipos y Compilación
Ejecuta en el terminal:
1. `npx tsc --noEmit`
2. `npm run build`
*Si surgen errores de tipos o referencias indefinidas, resuélvelos antes de iniciar el servidor.*

## 2. Despliegue de Prueba
1. Inicia el servidor de desarrollo local: `npm run dev`.
2. Verifica que el servidor devuelva una URL local accesible (ej. `http://localhost:5173`).

## 3. Validación Interactiva con el Agente de Navegador
1. Abre la URL en el navegador integrado.
2. Comprueba los siguientes puntos críticos:
   - **Clicker:** Hacer clic en el elemento principal debe sumar recursos y disparar un efecto visual (número flotante o cambio de frame).
   - **Tienda/Mejoras:** Verificar que los botones de compra permanezcan deshabilitados hasta tener los fondos necesarios y se habiliten dinámicamente.
   - **Tick Pasivo:** Esperar 3 segundos para confirmar que los generadores automáticos suman recursos según el tiempo transcurrido.
   - **Persistencia:** Recargar la página (`F5`) y verificar que el contador no vuelva a cero.
3. Genera una captura de pantalla del estado del juego en ejecución.