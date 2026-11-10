# Barrilete 🪁

Juego arcade de un solo botón para **Build & Play**. Vuelas un barrilete gigante de Sumpango el Día de Todos los Santos: el viento lo empuja, tú jalas o das cuerda.

## Cómo se juega

- **Mantén presionado** (clic, toque o espacio) para jalar el hilo: el barrilete sube, pero la cuerda se acorta y el hilo se tensa.
- **Suelta** para darle cuerda: el barrilete se aleja y baja.
- **Tirón corto**: un toque rápido (menos de 0,2 s) da un empujón hacia arriba. Sirve para esquivar; hay que esperar casi un segundo para repetirlo.
- Las **ráfagas** (rayas blancas) llegan desde la izquierda antes de pegarte: si te agarran jalando, el hilo se revienta. Las **calmas** (rayas azules punteadas) dejan caer el barrilete: ahí toca jalar.
- Atrapa **papel de china**, hace combo hasta ×8. Esquiva a los **rivales**: te cortan el hilo si lo cruzan cerca del barrilete (tramo amarillo).
- Menú: **Jugar**, **Mi barrilete** (pestañas Barrilete y Muñeco, con vista previa y botón aleatorio), **Puntuaciones** (Top 10 local) e **Instrucciones** (con diagramas).

Controles: ratón/toque en los botones; teclado con flechas o Tab para moverse, Enter o espacio para elegir, Esc para volver o pausar (también pausa al perder el foco).

## Qué cambió en la v2 y por qué

- **Rivales ya no matan por rozar.** Ahora cortan solo si cruzan el tramo de hilo cercano al barrilete (se ve en amarillo y se pone rojo cuando va a pasar). Un roce solo empuja y rompe el combo. Antes era frustrante: muertes que no se entendían.
- **Riesgo y recompensa.** Los puntos se multiplican por altura (hasta ×2,5), por volar «al filo» con el hilo muy tenso (×1,5) y durante eventos (×2). Subir y arriesgarse paga más.
- **Tirón corto vs. sostenido.** Una técnica nueva con un solo botón: el toque rápido da un impulso para esquivar; mantener presionado sigue siendo el control fino.
- **Eventos de viento con nombre.** Ventarrón, Calma chicha y Torbellino, con aviso de 3 s y 8 s de duración, rompen la monotonía y cambian qué hay que hacer.
- **Ráfagas legibles.** Las ráfagas y calmas ahora tienen una banda visible, y el HUD muestra la fuerza del viento y la cuenta regresiva («RÁFAGA en 1,2 s»).
- **Curva de dificultad más amable.** Los primeros 14 s no hay rivales, el primer evento llega a los 24 s y la dificultad sube en 150 s, no en 120. Más de un rival a la vez solo en la fase tardía.
- **Avisos antes de perder.** «¡JALA!» y un pitido cuando el barrilete va muy bajo; popups de puntos y combo, sacudida leve y partículas.
- **Personalizar, puntuaciones e instrucciones** (todo en localStorage, sin red): clave `barrilete_cfg`, `barrilete_top` y `barrilete_ini`.

## Reglas del concurso

- Peso total que descarga el navegador: **27989 bytes** (`index.html`, límite 32 KB = 32768 bytes). No carga nada más.
- Sin librerías, frameworks ni motores: solo Canvas 2D, Web Audio y `localStorage`.
- Sin assets: nada de imágenes, audio ni fuentes externas. Todo se dibuja y suena con código; la letra es la fuente del sistema (`system-ui`).
- Sin red: el Top 10 vive solo en tu navegador.

## Correrlo

Abre `index.html` en el navegador o sirve la carpeta (por ejemplo `python3 -m http.server`). Funciona en GitHub Pages.

## Código

- `src/game.js` y `src/index.html`: fuente legible.
- `node build.mjs`: junta todo en un solo `index.html`. Minifica con `npx terser` (solo desarrollo, no va en el build); si no está disponible, usa la fuente tal cual. `node build.mjs --dev` genera `index.dev.html` con nombres legibles para pruebas (no se publica).


## v3 — controles e instrucciones

- **Un solo botón**: mantén con clic izquierdo, toque o Espacio (↑ y W también). No hay control direccional con flechas: rompería la mecánica de cuerda/viento y no existe en móvil. Las flechas solo navegan menús.
- **Toque vs. mantener**: umbral de 0,22 s; el toque da un tirón corto aunque dure menos que un fotograma (entrada por eventos); al pasar el umbral suena y se muestra la señal de "mantener".
- **Sin perder entradas**: pointer capture, sin menú contextual, touch-action none (sin scroll/zoom), soltar fuera de la ventana o perder el foco/cambiar de pestaña pausa y limpia la entrada.
- **Pista contextual** en la primera partida ("mantén para jalar", "suelta para dar cuerda", toque) que desaparece al hacerlo; modo **Practicar** sin rivales ni ranking.
- **Instrucciones animadas** de 3 páginas con indicador, flechas/deslizar/clic, icono de clic/toque/Espacio, ráfaga, calma, tensión, rival.
- Arreglos: paleta "Hielo" (se quitó el cambio de tono), cola de la vista previa larga, barrilete del menú fuera de botones/texto.


## v4 — peso, papel de china con viento y muñeco personalizable

**Peso: 31613 → 27739 bytes** (meta ≤28000), *con* las dos funciones nuevas. Técnicas, con el tamaño tras cada paso:

| Paso (tamaño total del `index.html` tras cada uno) | Bytes |
|---|---|
| v3 de partida | 31613 |
| Terser más agresivo (passes 5, `unsafe_*`, hoist, `--mangle-props`) | ≈ −100 como mucho; los nombres de propiedad ya eran cortos y mangle-props rompería los datos guardados, **descartado** |
| Reescritura con ayudantes de dibujo (`P` polígonos, `fR`, `ci`, `ar`, `ln`, `rrc`), contexto `X` intercambiable para dibujar el fondo y el barrilete fuera de pantalla, un solo `tone` para tono y ruido, HTML/CSS mínimos — **ya con papel con viento y muñeco incluidos** | 30065 |
| Funciones declaradas → flechas `const` (terser no lo hace solo) | 29856 |
| Instrucciones y textos más cortos, `ez()` para suavizados, navegación de teclado unificada | 29264 |
| `cfg` como lista de índices (`CT`): un solo `set`, `rndCfg` y `okCfg` para barrilete y muñeco; colores `#rgb` de 3 dígitos | 28880 |
| Fondo sin árbol ni cables, ráfaga sin degradado, diagramas de tensión y eventos más simples, constante para `#0a0513` | 28224 |
| Alias `ga/sa/re/tt` para `globalAlpha/save/restore/translate` | 27838 |
| Constante para `'#fff'` y ajustes finales | 27739 |
| Roadroller (packer) | 16033, pero el arranque tarda ~0,6 s (>300 ms) y mete un descompresor de terceros: **descartado** |

**Papel de china con viento.** Cada papel nace en un sitio y se deja llevar: se desplaza hacia la derecha en proporción al viento local (`windAt`), la ráfaga lo empuja y lo eleva, la calma lo frena y lo deja en vaivén. Aletea (inclinación, cizalla y fleco ondulante según el viento) y deja una estela corta en el sentido del movimiento. Es justo: la posición siempre está dentro de la pantalla (x ≤ ancho−30, y entre 50 y suelo−60) y dentro del alcance del hilo (radio ≤ Lmax−12); el desplazamiento es suave (constante de tiempo ≈0,45 s), las ráfagas se ven venir (banda + cuenta regresiva del HUD) y el temporizador de vida es el mismo.

**Muñeco personalizable** (Mi barrilete → pestaña «Muñeco»): tono de piel (5), camisa (2 lisas y 3 **huipiles** con franjas y rombos), pantalón o **corte** (falda con rayas), sombrero (ninguno, de palma, gorra) y pelo (corto, trenza, largo, canoso). Vista previa grande en vivo, «Aleatorio» por pestaña, se guarda en `barrilete_cfg` (diez índices) y se usa en el juego, el menú y los diagramas de instrucciones. En el juego se inclina hacia atrás al jalar y el brazo apunta al hilo.

## v5 — balance (el juego era demasiado duro)

Diagnóstico con 60 partidas por perfil de jugador simulado (`bb-tools/human.mjs`: reacción 250–350 ms, solo ve lo que hay en pantalla, se equivoca y pulsa con ruido). En v4 la mediana era ~34 s y ~5–7 % moría antes de 10 s; el «experto» ingenuo del test moría igual a ~35 s: el juego castigaba por encima de la habilidad. Causas medidas en el código y en las muertes:

- Cuerda mínima de 70 px: al jalar quedaba corta y el barrilete caía o reventaba el hilo en espiral. Ahora `LMIN=130`, y jalar acorta más despacio (−40 px/s en vez de −60).
- Sustentación al jalar insuficiente en calma: «Calma chicha» (viento ×0,5) era caída segura incluso jalando. Ahora ×0,68, gravedad 200 y menos picado al soltar (0,28): con calma se sostiene si jalas.
- Tensión: la deformación subía muy rápido. Tasa 2,5 → 1,4 y se recupera 0,6 → 1,0 por segundo.
- Rivales desde los 14 s y apuntados al barrilete. Ahora empiezan a los 26 s (con intervalo 8 s → 3,2 s), nacen con más dispersión vertical, y el tramo vulnerable crece con la dificultad (70 → 130 px). Primer evento a los 36 s. La dificultad sube durante 200 s.
- Primeras calmas muy profundas: ahora más suaves y ráfagas iniciales más débiles, que crecen con el tiempo.
- **Salvavidas** (♥ en el HUD): perdona la primera caída, hilo cortado o hilo reventado de cada vida (2,5 s de invulnerabilidad, combo a ×1) y se recarga en 45 s.

Resultado (60 partidas por perfil, mismas semillas): novato mediana ~100 s, 0 % <15 s; promedio ~113 s; experto ~123 s y 5 % llega a 3 min (máx. 3:07); el techo sigue ahí: ningún perfil pasa de ~3:30. Peso final 27989 bytes.
