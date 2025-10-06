import Hls from "hls.js";
import { CHANNELS } from "./channels.js";

const video = document.getElementById("player");
const btnFs = document.getElementById("btn-fullscreen");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");
const btnList = document.getElementById("toggle-list");
const overlay = document.getElementById("channel-overlay");
const closeOverlay = document.getElementById("close-overlay");
const listEl = document.getElementById("channel-list");
const toast = document.getElementById("toast");
const clockEl = document.getElementById("clock");

let currentIndex = 0;
let hls;

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 900);
}

function formatTime(d=new Date()) {
  return d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
}

function renderClock() { clockEl.textContent = formatTime(); }
setInterval(renderClock, 1000); renderClock();

function attachHls(url, type) {
  if (hls) { hls.destroy(); hls = null; }
  if (type === "hls") {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
      showToast("HLS não suportado");
      return;
    }
  } else {
    video.src = url;
  }
  video.play().catch(() => {});
}

function setChannel(index) {
  currentIndex = (index + CHANNELS.length) % CHANNELS.length;
  const ch = CHANNELS[currentIndex];
  attachHls(ch.url, ch.type);
  showToast(`Canal ${ch.id}: ${ch.name}`);
  highlightSelected();
}

function nextChannel() { setChannel(currentIndex + 1); }
function prevChannel() { setChannel(currentIndex - 1); }

function toggleFullscreen() {
  const el = document.fullscreenElement ? document : document.documentElement;
  if (!document.fullscreenElement) {
    el.requestFullscreen?.({ navigationUI: "hide" });
  } else {
    el.exitFullscreen?.();
  }
}

function buildList() {
  listEl.innerHTML = "";
  CHANNELS.forEach((ch, i) => {
    const li = document.createElement("li");
    li.setAttribute("data-index", i);
    li.innerHTML = `
      <span class="num">${ch.id}</span>
      <span class="name">${ch.name}</span>
      <span class="meta">${ch.meta}</span>
    `;
    li.addEventListener("click", () => {
      setChannel(i);
      overlay.classList.remove("open");
    });
    listEl.appendChild(li);
  });
  highlightSelected();
}
function highlightSelected() {
  [...listEl.children].forEach((li, i) => {
    li.style.outline = i === currentIndex ? "2px solid rgba(255,255,255,0.8)" : "none";
  });
}

btnPrev.addEventListener("click", prevChannel);
btnNext.addEventListener("click", nextChannel);
btnFs.addEventListener("click", toggleFullscreen);
btnList.addEventListener("click", () => overlay.classList.toggle("open"));
closeOverlay.addEventListener("click", () => overlay.classList.remove("open"));

document.addEventListener("keydown", (e) => {
  // Works in fullscreen too
  switch (e.key) {
    case "ArrowRight":
    case "+":
    case "=":
      nextChannel(); break;
    case "ArrowLeft":
    case "-":
    case "_":
      prevChannel(); break;
    case "f":
    case "F":
      toggleFullscreen(); break;
    case "l":
    case "L":
      overlay.classList.toggle("open"); break;
    default: {
      // numeric channel jump (1..9)
      if (/^[0-9]$/.test(e.key)) {
        const idx = CHANNELS.findIndex(c => String(c.id) === e.key);
        if (idx >= 0) setChannel(idx);
      }
    }
  }
});

video.addEventListener("error", () => showToast("Erro no vídeo"));
video.addEventListener("ended", () => showToast("Fim do conteúdo"));
video.addEventListener("play", () => showToast("Reproduzindo"));
video.addEventListener("pause", () => showToast("Pausado"));

buildList();
setChannel(0);

// Keep controls visible briefly on move
let uiTimer;
document.addEventListener("mousemove", () => {
  document.getElementById("ui").style.opacity = 1;
  clearTimeout(uiTimer);
  uiTimer = setTimeout(() => { document.getElementById("ui").style.opacity = 0.9; }, 1800);
});
document.getElementById("ui").style.opacity = 0.2;

