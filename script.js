const DURATION_MS = 60 * 60 * 1000;
const STORAGE_KEY = "contadorUnaHora";
const VALID_CODE = "1234";
const CHALLENGE_TEXT = "Ahora tienes una hora para resolver las pistas y poder volver";

const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");
const showClueBtn = document.getElementById("showClueBtn");
const introSectionEl = document.getElementById("introSection");
const clueSectionEl = document.getElementById("clueSection");
const gameSectionEl = document.getElementById("gameSection");
const challengeMessageEl = document.getElementById("challengeMessage");
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

function showGameUI() {
  introSectionEl.classList.add("is-hidden");
  clueSectionEl.classList.remove("is-hidden");
  gameSectionEl.classList.remove("is-hidden");
  challengeMessageEl.textContent = CHALLENGE_TEXT;
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
  localStorage.removeItem(STORAGE_KEY);
}

function startRunningCountdown(endAtMs) {
  if (intervalId !== null) {
    clearInterval(intervalId);
  }
  showGameUI();
  setValidationEnabled(true);

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

function handleShowClue() {
  if (intervalId !== null) {
    return;
  }
  handleStart();
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
      startRunningCountdown(session.endAtMs);
      return;
    }
    showGameUI();
    finishCountdown(session.endAtMs);
    return;
  }

  setValidationEnabled(false);
  timerEl.textContent = formatRemaining(DURATION_MS);
}

showClueBtn.addEventListener("click", handleShowClue);
validateBtnEl.addEventListener("click", handleValidate);
init();
