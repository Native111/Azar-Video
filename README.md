# Ruleta del Azar — VideoAleatorio

Aplicación web que gira una ruleta estilo casino y selecciona al azar un video de YouTube
de los canales configurados.

## Cómo usarla

1. Abre `index.html` con doble clic (o clic derecho → *Abrir con* → tu navegador).
2. Pulsa **GIRAR**.
3. La ruleta gira y se detiene en un canal al azar.
4. Se muestra un video seleccionado al azar de ese canal:
   > "Según tu suerte… este video fue seleccionado para ti"
5. Pulsa **Ir al video** para abrirlo directamente en YouTube.
6. Con **Girar de nuevo** puedes volver a probar.

No necesita servidor ni conexión a internet: los datos de los videos están incluidos
en `videos.js` y los enlaces abren YouTube.

## Archivos

| Archivo | Descripción |
|---|---|
| `index.html` | Estructura de la aplicación |
| `styles.css` | Tema casino (fieltro verde, negro y dorado) |
| `videos.js` | Datos de los 90 videos (30 por canal) |
| `app.js` | Lógica de la ruleta y selección aleatoria |

## Canales incluidos

- [InvernovAH](https://www.youtube.com/@InvernovAH/videos)
- [Tengo un Plan](https://www.youtube.com/@tengounplanpodcast)
- [Sociología Para Entender](https://www.youtube.com/@SociologíaParaEntender)

## Características

- Ruleta dibujada en `<canvas>` con 12 segmentos (4 por canal), aro y buje dorados.
- Giro con aceleración/desaceleración suave (~4,8 s) y varias vueltas.
- Selección uniforme entre canales y videos.
- Diseño responsive (móvil, tablet y escritorio).
- Pie de página con marca de agua y el crédito: **"Aplicación creado por Consorcioweb"**.

## Actualizar la lista de videos

Para cambiar los videos, edita el arreglo `window.CHANNELS` en `videos.js`.
Cada video se define así:

```js
{ id: "ID_DE_YOUTUBE", title: "Título del video" }
```

---

*Aplicación creado por Consorcioweb*
