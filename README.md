# Barrilete

Juego arcade de un solo botón para Build & Play. Vuelas un barrilete gigante
de Sumpango el Día de Todos los Santos: el viento lo empuja y tú jalas o das
cuerda para mantenerlo en el aire.

## Cómo se juega

- **Mantén presionado** (clic, toque, Espacio, ↑ o W) para jalar el hilo: el
  barrilete sube, pero la cuerda se acorta y el hilo se tensa.
- **Suelta** para dar cuerda: el barrilete se aleja y baja.
- **Toque corto** (menos de 0,22 s): da un tirón hacia arriba para esquivar.
  Necesita casi un segundo de recarga.
- Las **ráfagas** llegan desde la izquierda; si te agarran jalando, el hilo se
  revienta. Las **calmas** dejan caer el barrilete: ahí toca jalar.
- Atrapa **papel de china** para subir el combo (hasta ×8) y esquiva a los
  **rivales**, que cortan el hilo si lo cruzan en el tramo amarillo.
- El **salvavidas** perdona un fallo (caída, corte o hilo roto) y se recarga
  con el tiempo.
- Menú: Jugar, Mi barrilete (barrilete y muñeco), Puntuaciones (Top 10 local)
  e Instrucciones. Las flechas, Tab, Enter y Esc navegan los menús.

## Reglas del concurso

- `index.html` pesa menos de 32 KB (32 768 bytes) y no carga nada más.
- Sin librerías ni frameworks: solo Canvas 2D, Web Audio y `localStorage`.
- Cero assets: no hay imágenes, audio ni fuentes externas. Todo se dibuja y
  suena con código, y el texto usa la fuente del sistema.
- Sin red: las puntuaciones y la personalización viven en el navegador.

## Build

```
node build.mjs          # genera index.html (el que se publica)
node build.mjs --dev    # genera index.dev.html, sin renombrar, para pruebas
```

El build mete `src/game.js` dentro de `src/index.html` y lo minifica con
`npx terser`, que solo se usa al compilar. Si terser no está disponible, deja
el código sin minificar y avisa. Para jugar, abre `index.html` en el navegador.

## Estructura

- `src/index.html`: plantilla con el estilo y el canvas.
- `src/game.js`: todo el juego, en este orden: constantes y datos, dibujo,
  viento, audio, barrilete y fondo, física y reglas, pantallas, entrada.
- `build.mjs`: arma y minifica el archivo final.
