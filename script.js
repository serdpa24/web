const DURATION_MS = 60 * 60 * 1000;
const STORAGE_KEY = "contadorUnaHora";
const VALID_CODE = "1234";

const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const seenVideoEl = document.getElementById("seenVideo");
const codeInputEl = document.getElementById("codeInput");
const validateBtnEl = document.getElementById("validateBtn");
const validationResultEl = document.getElementById("validationResult");

let intervalId = null;

function setValidationEnabled(isEnabled) {
  codeInputEl.disabled = !isEnabled;
  validateBtnEl.disabled = !isEnabled;
  if (!isEnabled) {
    codeInputEl.value = "";
    validationResultEl.textContent = "Validacion inactiva hasta iniciar.";
  } else {
    validationResultEl.textContent = "Validacion activa.";
  }
}

function updateStartButtonState() {
  const countdownActive = intervalId !== null;
  startBtn.disabled = countdownActive || !seenVideoEl.checked;
}

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

function finishCountdown(endAtMs) {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }

  timerEl.textContent = "00:00:00";
  statusEl.textContent = `Finalizado a las ${formatDate(new Date(endAtMs))}.`;
  setValidationEnabled(false);
  updateStartButtonState();
  localStorage.removeItem(STORAGE_KEY);
}

function startRunningCountdown(endAtMs) {
  if (intervalId !== null) {
    clearInterval(intervalId);
  }
  setValidationEnabled(true);
  updateStartButtonState();

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
  startRunningCountdown(endAtMs);
}

function handleValidate() {
  const userValue = codeInputEl.value.trim();
  if (userValue === VALID_CODE) {
    validationResultEl.textContent = "Codigo correcto.";
    return;
  }
  validationResultEl.textContent = "Codigo incorrecto.";
}

function init() {
  const session = loadSession();
  if (session && Number.isFinite(session.endAtMs)) {
    if (session.endAtMs > Date.now()) {
      seenVideoEl.checked = true;
      startRunningCountdown(session.endAtMs);
      return;
    }
    finishCountdown(session.endAtMs);
    return;
  }

  setValidationEnabled(false);
  updateStartButtonState();
  timerEl.textContent = formatRemaining(DURATION_MS);
}

startBtn.addEventListener("click", handleStart);
seenVideoEl.addEventListener("change", updateStartButtonState);
validateBtnEl.addEventListener("click", handleValidate);
init();
