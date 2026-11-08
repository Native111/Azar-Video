/* ==========================================================================
   Ruleta del Azar — VideoAleatorio
   Lógica: gira la ruleta, selecciona un canal al azar y luego un video
   aleatorio de ese canal. Creado por Consorcioweb.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Configuración ---------- */
  var SEGMENTS_PER_CHANNEL = 4;           // 4 segmentos por canal (12 en total)
  var COLORS = ["#C8102E", "#191914", "#0B6B3A"]; // rojo / negro / verde (casino)
  var SHORT = ["InvernovAH", "Tengo un Plan", "Sociolog\u00eda"];
  var SPIN_MS = 4800;                      // duración del giro
  var MIN_TURNS = 6;
  var MAX_TURNS = 9;

  var canvas = document.getElementById("wheel");
  var ctx = canvas.getContext("2d");
  var spinBtn = document.getElementById("spinBtn");
  var hint = document.getElementById("hint");
  var resultEl = document.getElementById("result");
  var videoTitleEl = document.getElementById("videoTitle");
  var channelNameEl = document.getElementById("channelName");
  var watchBtn = document.getElementById("watchBtn");
  var videoUrlEl = document.getElementById("videoUrl");
  var againBtn = document.getElementById("againBtn");

  var currentUrl = "";

  var channels = window.CHANNELS || [];
  var totalSegments = channels.length * SEGMENTS_PER_CHANNEL;
  var segAngle = (Math.PI * 2) / totalSegments;

  var rotation = 0;          // radianes
  var spinning = false;

  /* ---------- Dibujo de la ruleta ---------- */
  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssW = canvas.clientWidth || 640;
    var target = 640 * dpr;
    if (canvas.width !== target) {
      canvas.width = target;
      canvas.height = target;
    }
    return { w: canvas.width, h: canvas.height };
  }

  function drawWheel(rot) {
    var s = size();
    var w = s.w, h = s.h;
    var cx = w / 2, cy = h / 2;
    var R = Math.min(w, h) / 2 - 6;

    ctx.clearRect(0, 0, w, h);

    // Fondo del disco
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = "#0b1a12";
    ctx.fill();
    ctx.restore();

    // Segmentos
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    for (var i = 0; i < totalSegments; i++) {
      var ch = i % channels.length;
      var start = i * segAngle;
      var end = start + segAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, start, end);
      ctx.closePath();
      ctx.fillStyle = COLORS[ch % COLORS.length];
      ctx.fill();

      // Separador dorado
      ctx.strokeStyle = "rgba(231,193,74,0.85)";
      ctx.lineWidth = Math.max(1.4, R * 0.006);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(start) * R, Math.sin(start) * R);
      ctx.stroke();

      // Etiqueta
      ctx.save();
      ctx.rotate(start + segAngle / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      var fs = Math.max(11, Math.round(R * 0.052));
      ctx.font = "700 " + fs + "px 'Segoe UI', system-ui, sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 6;
      var label = SHORT[ch] || channels[ch].label;
      ctx.fillText(label, R - Math.round(R * 0.07), 0);
      ctx.restore();
    }

    ctx.restore();

    // Aro interior
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(231,193,74,0.95)";
    ctx.lineWidth = Math.max(2, R * 0.012);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- Utilidades matemáticas ---------- */
  var TAU = Math.PI * 2;
  function normalize(a) {
    a = a % TAU;
    return a < 0 ? a + TAU : a;
  }

  // Segmento que está bajo el puntero (arriba) para una rotación dada
  function segmentAtPointer(rot) {
    var pointer = -Math.PI / 2;
    var a = normalize(pointer - rot);
    return Math.floor(a / segAngle) % totalSegments;
  }

  /* ---------- Selección de video ---------- */
  function pickVideo(channelIndex) {
    var ch = channels[channelIndex];
    if (!ch || !ch.videos || !ch.videos.length) return null;
    var v = ch.videos[Math.floor(Math.random() * ch.videos.length)];
    return { channel: ch, video: v };
  }

  function showResult(channel, video) {
    videoTitleEl.textContent = "\u201c" + video.title + "\u201d";
    channelNameEl.textContent = channel.label;

    currentUrl = "https://www.youtube.com/watch?v=" + encodeURIComponent(video.id);
    watchBtn.href = currentUrl;
    if (videoUrlEl) {
      videoUrlEl.href = currentUrl;
      videoUrlEl.textContent = currentUrl.replace("https://www.", "");
    }

    resultEl.hidden = false;
    try {
      resultEl.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (e) {
      resultEl.scrollIntoView();
    }
  }

  /* Apertura robusta: intenta nueva pestaña y, si el navegador la bloquea,
     navega en la misma pestaña. */
  function openVideo(ev) {
    if (!currentUrl) { return; }
    if (ev) { ev.preventDefault(); }

    var win = null;
    try {
      win = window.open(currentUrl, "_blank");
    } catch (e) {
      win = null;
    }

    if (!win) {
      // Pestaña nueva bloqueada -> abrir en la misma pestaña
      try {
        window.location.href = currentUrl;
      } catch (e) {
        window.location.assign(currentUrl);
      }
    }
  }

  /* ---------- Giro ---------- */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function spin() {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;
    resultEl.hidden = true;
    hint.textContent = "Girando… \u00a1suerte!";

    // Elegir segmento ganador al azar
    var winnerIndex = Math.floor(Math.random() * totalSegments);
    var winnerChannel = winnerIndex % channels.length;

    // Rotación objetivo (centro del segmento, con leve desviación)
    var pointer = -Math.PI / 2;
    var jitter = (Math.random() - 0.5) * segAngle * 0.62;
    var target = pointer - (winnerIndex * segAngle + segAngle / 2 + jitter);

    var startRot = rotation;
    var delta = normalize(target - startRot);
    var turns = MIN_TURNS + Math.floor(Math.random() * (MAX_TURNS - MIN_TURNS + 1));
    var totalRot = delta + turns * TAU;

    var t0 = performance.now();

    function frame(now) {
      var p = Math.min(1, (now - t0) / SPIN_MS);
      var eased = easeOutCubic(p);
      rotation = startRot + totalRot * eased;
      drawWheel(rotation);

      if (p < 1) {
        requestAnimationFrame(frame);
        return;
      }

      // Fin del giro
      rotation = startRot + totalRot;
      drawWheel(rotation);

      var landed = segmentAtPointer(rotation);
      var chIdx = landed % channels.length;

      // Confirmar el canal ganador (usar el del segmento donde cayó)
      var picked = pickVideo(chIdx);
      spinning = false;
      spinBtn.disabled = false;

      if (picked) {
        hint.textContent = "Haz clic en GIRAR para volver a probar tu suerte";
        showResult(picked.channel, picked.video);
      } else {
        hint.textContent = "No se encontraron videos. Intenta de nuevo.";
      }
    }

    requestAnimationFrame(frame);
  }

  /* ---------- Eventos ---------- */
  spinBtn.addEventListener("click", spin);
  watchBtn.addEventListener("click", openVideo);
  if (videoUrlEl) {
    videoUrlEl.addEventListener("click", openVideo);
  }

  againBtn.addEventListener("click", function () {
    resultEl.hidden = true;
    hint.textContent = "Haz clic en GIRAR para probar tu suerte";
    spin();
  });

  window.addEventListener("resize", function () {
    drawWheel(rotation);
  });

  /* ---------- Inicio ---------- */
  if (!channels.length) {
    hint.textContent = "Error: no se cargaron los canales de video.";
    spinBtn.disabled = true;
  } else {
    drawWheel(rotation);
  }
})();
