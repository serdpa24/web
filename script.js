const DURATION_MS = 60 * 60 * 1000;
const STORAGE_KEY = "contadorUnaHora";

const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");

let intervalId = null;

function formatDate(date) {
  return date.toLocaleString("es-ES");
}

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

function saveSession(startAtMs) {
  const endAtMs = startAtMs + DURATION_MS;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      startAtMs,
      endAtMs,
    })
  );
}

function loadSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_error) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function downloadLogFile(startAtMs) {
  const endAtMs = startAtMs + DURATION_MS;
  const content = [
    "Registro de contador",
    `Inicio: ${formatDate(new Date(startAtMs))}`,
    `Fin previsto: ${formatDate(new Date(endAtMs))}`,
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date(startAtMs).toISOString().replace(/[:.]/g, "-");

  link.href = url;
  link.download = `contador_${timestamp}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function finishCountdown(endAtMs) {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }

  timerEl.textContent = "00:00:00";
  statusEl.textContent = `Finalizado a las ${formatDate(new Date(endAtMs))}.`;
  startBtn.disabled = false;
  localStorage.removeItem(STORAGE_KEY);
}

function startRunningCountdown(endAtMs) {
  startBtn.disabled = true;

  if (intervalId !== null) {
    clearInterval(intervalId);
  }

  const tick = () => {
    const now = Date.now();
    const remaining = endAtMs - now;

    if (remaining <= 0) {
      finishCountdown(endAtMs);
      return;
    }

    timerEl.textContent = formatRemaining(remaining);
    statusEl.textContent = `Termina a las ${formatDate(new Date(endAtMs))}.`;
  };

  tick();
  intervalId = window.setInterval(tick, 1000);
}

function handleStart() {
  const startAtMs = Date.now();
  const endAtMs = startAtMs + DURATION_MS;

  saveSession(startAtMs);
  downloadLogFile(startAtMs);
  startRunningCountdown(endAtMs);
}

function init() {
  const session = loadSession();
  if (session && Number.isFinite(session.endAtMs)) {
    if (session.endAtMs > Date.now()) {
      startRunningCountdown(session.endAtMs);
      return;
    }
    finishCountdown(session.endAtMs);
    return;
  }

  timerEl.textContent = formatRemaining(DURATION_MS);
}

startBtn.addEventListener("click", handleStart);
init();
