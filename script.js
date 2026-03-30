// Escape Cumpleaños: 4 pantallas por `step` + 3 minijuegos.

const STEP_KEY = "step";

const STORAGE_KEYS = {
  step2Done: "escape_step2_done",
  step2Digit: "escape_step2_digit",
  step3Done: "escape_step3_done",
  step3Digit: "escape_step3_digit",
  step4Done: "escape_step4_done",
  step4Digit: "escape_step4_digit",
};

// Configura aquí los dígitos finales (A/B/C) para que coincidan con tu candado real.
const DIGIT_A = "8";
const DIGIT_B = "10";
const DIGIT_C = "888";
const FINAL_LOCK_CODE = `${DIGIT_A}${DIGIT_B}${DIGIT_C}`;

// Configura aquí los textos de pista física.
const CLUE_FOR_GIFT_LOCATION =
  "Pista: Fywge hiqxvs hi euyioos uyi Pevmeqs xi gsqwmkyms tsv wiv yq fvewew.";
const CLUE_FOR_KEY_LOCATION =
  "Pista: \n Nunca pensé que esto acabaría así \n Observa bien cada detalle \n Hace falta paciencia \n Aunque parezca difícil \n Confía en tu intuición \n Es más sencillo de lo que parece \n Fíjate en lo obvio \n Al final todo encaja \n Llega el momento de decidir \n Toma la pista correcta \n Ahora actúa \n Sigue adelante \n Es tu oportunidad \n Recuerda lo aprendido \n Un paso más \n No te rindas \n Llega hasta el final \n Inténtalo otra vez \n Nunca es tarde \n Confía en ti \n Encuentra la salida";
const ZIP_FINAL_TEXT =
  "Cuando tengas el candado abierto, ¡revelará el regalo! Introduce el código cuando estés listo.";

const SIMON_FINAL_TEXT =
  "¡Enhorabuena! Has completado la prueba final. Ya puedes abrir el candado con el código.";

const MEMORY_IMAGES = [
  "ana.jpeg",
  "angelines.jpeg",
  "burgos.jpeg",
  "chiquita.jpeg",
  "familia.jpeg",
  "irene.jpeg",
  "javi.jpeg",
  "javipadre.jpeg",
  "juanjo.jpeg",
  "laura.jpeg",
  "mariangeles.jpeg",
  "minisofi.jpeg",
  "nosotros.jpeg",
  "oscar.jpeg",
  "sofigocha.jpeg",
  "yo.jpeg",
];

const MEM_PHASES = [
  { pairs: 10, label: "Fase 1 (10 pares)" },
  { pairs: 12, label: "Fase 2 (12 pares)" },
  { pairs: 16, label: "Fase 3 (16 pares)" },
];

function $(id) {
  return document.getElementById(id);
}

function getStepFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get(STEP_KEY);
  const step = Number.parseInt(raw !== null ? raw : "1", 10);
  if (!Number.isFinite(step)) return 1;
  return Math.min(5, Math.max(1, step));
}

function showEl(el, isVisible) {
  if (!el) return;
  el.classList.toggle("is-hidden", !isVisible);
}

function setStep(step) {
  const step1El = $("step1");
  const step2El = $("step2");
  const step3El = $("step3");
  const step4El = $("step4");
  const step5El = $("step5");
  
  
  showEl(step1El, step === 1);
  showEl(step2El, step === 2);
  showEl(step3El, step === 3);
  showEl(step4El, step === 4);
  showEl(step5El, step === 5);
  

  $("progressText").textContent = `Paso ${step} de 5`;
}

function resetDinoState() {
  const canvas = $("dinoCanvas");
  const ctx = canvas.getContext("2d");

  dinoState.running = false;
  dinoState.gameOver = false;
  dinoState.score = 0;
  dinoState.obstacles = [];
  dinoState.lastSpawnAt = 0;
  dinoState.lastFrameAt = 0;
  dinoState.playerVy = 0;
  dinoState.playerY = dinoGroundY();
  dinoState.nextJumpAtMs = 0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  paintDinoFrame();
  $("dinoScore").textContent = String(dinoState.score);
  $("dinoStatus").textContent = "";
}

function dinoGroundY() {
  const canvas = $("dinoCanvas");
  return Math.round(canvas.height * 0.78);
}

const dinoState = {
  running: false,
  gameOver: false,
  score: 0,
  obstacles: [],
  lastSpawnAt: 0,
  lastFrameAt: 0,
  playerX: 90,
  playerY: 0,
  playerVy: 0,
  gravity: 2200,
  jumpStrength: 820,
  obstacleSpeed: 330,
  obstacleSpawnEveryMs: 750,
  nextJumpAtMs: 0,
  startedAt: 0,
  rafId: null,
};

function paintDinoFrame() {
  const canvas = $("dinoCanvas");
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const groundY = dinoGroundY();

  // Ground
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  // Player (simple silhouette)
  const playerW = 22;
  const playerH = 34;
  const px = dinoState.playerX;
  const py = dinoState.playerY - playerH;
  ctx.fillStyle = "#2563eb";
  ctx.fillRect(px, py, playerW, playerH);

  // Obstacles
  for (const ob of dinoState.obstacles) {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(ob.x, groundY - ob.h, ob.w, ob.h);
  }
}

function spawnDinoObstacle() {
  const canvas = $("dinoCanvas");
  const groundY = dinoGroundY();

  const variants = [
    { w: 18, h: 36 },
    { w: 22, h: 28 },
    { w: 28, h: 44 },
    { w: 20, h: 30 },
  ];
  const v = variants[Math.floor(Math.random() * variants.length)];
  dinoState.obstacles.push({
    x: canvas.width + 20,
    w: v.w,
    h: v.h,
    passed: false,
  });
}

function rectsIntersect(a, b) {
  return !(
    a.x + a.w < b.x ||
    a.x > b.x + b.w ||
    a.y + a.h < b.y ||
    a.y > b.y + b.h
  );
}

function tickDino(nowMs) {
  const canvas = $("dinoCanvas");
  const ctx = canvas.getContext("2d");
  const groundY = dinoGroundY();

  if (!dinoState.running) return;

  if (!dinoState.lastFrameAt) dinoState.lastFrameAt = nowMs;
  const dt = Math.min(0.032, (nowMs - dinoState.lastFrameAt) / 1000);
  dinoState.lastFrameAt = nowMs;

  // Spawn
  if (nowMs - dinoState.lastSpawnAt >= dinoState.obstacleSpawnEveryMs) {
    dinoState.lastSpawnAt = nowMs;
    spawnDinoObstacle();
  }

  // Player physics
  dinoState.playerVy += dinoState.gravity * dt;
  dinoState.playerY += dinoState.playerVy * dt;
  const minY = groundY;
  if (dinoState.playerY > minY) {
    dinoState.playerY = minY;
    dinoState.playerVy = 0;
  }

  // Move obstacles & score
  const playerW = 22;
  const playerH = 34;
  const playerRect = {
    x: dinoState.playerX,
    y: dinoState.playerY - playerH,
    w: playerW,
    h: playerH,
  };

  for (const ob of dinoState.obstacles) {
    ob.x -= dinoState.obstacleSpeed * dt;

    // Score when obstacle is passed
    if (!ob.passed && ob.x + ob.w < dinoState.playerX) {
      ob.passed = true;
      dinoState.score += 100;
      $("dinoScore").textContent = String(dinoState.score);

      if (dinoState.score >= 5000) {
        winDino();
        return;
      }
    }

    // Collision
    const obRect = { x: ob.x, y: groundY - ob.h, w: ob.w, h: ob.h };
    if (rectsIntersect(playerRect, obRect)) {
      dinoGameOver();
      return;
    }
  }

  dinoState.obstacles = dinoState.obstacles.filter((o) => o.x + o.w > -30);
  paintDinoFrame();

  dinoState.rafId = requestAnimationFrame(tickDino);
}

function startDinoIfNeeded() {
  if (dinoState.running) return;
  if (dinoState.gameOver) {
    resetDinoState();
  }
  dinoState.running = true;
  dinoState.gameOver = false;
  dinoState.startedAt = performance.now();
  dinoState.lastFrameAt = 0;
  dinoState.lastSpawnAt = 0;
  dinoState.obstacles = [];
  dinoState.playerY = dinoGroundY();
  dinoState.playerVy = 0;
  $("dinoStatus").textContent = "¡Vamos! Salta para esquivar obstáculos.";
  dinoState.rafId = requestAnimationFrame(tickDino);
}

function tryJumpDino(nowMs) {
  const groundY = dinoGroundY();
  const canJump = dinoState.playerY >= groundY - 0.5;
  if (!canJump) return;
  if (nowMs < dinoState.nextJumpAtMs) return;
  dinoState.playerVy = -dinoState.jumpStrength;
  dinoState.nextJumpAtMs = nowMs + 120;
}

function dinoGameOver() {
  dinoState.gameOver = true;
  dinoState.running = false;
  if (dinoState.rafId) cancelAnimationFrame(dinoState.rafId);
  dinoState.rafId = null;
  $("dinoStatus").textContent =
    "Ups. Casi... Intenta de nuevo. (Pulsar Reiniciar o Salta para empezar)";
  $("dinoStatus").style.fontWeight = "700";
}

function winDino() {
  dinoState.running = false;
  dinoState.gameOver = true;
  if (dinoState.rafId) cancelAnimationFrame(dinoState.rafId);
  dinoState.rafId = null;

  $("dinoStatus").textContent = "¡Perfecto! Has superado la prueba 1.";

  localStorage.setItem(STORAGE_KEYS.step2Done, "1");
  localStorage.setItem(STORAGE_KEYS.step2Digit, DIGIT_A);

  //$("digitA").textContent = DIGIT_A;
  $("dinoClue").textContent = CLUE_FOR_GIFT_LOCATION;
  showEl($("step2Result"), true);
  showEl($("dinoRestartBtn"), false);
  showEl($("dinoJumpBtn"), false);
}

function initDino() {
  $("dinoGoal").textContent = "5000";

  const canvas = $("dinoCanvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      startDinoIfNeeded();
      tryJumpDino(performance.now());
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      startDinoIfNeeded();
      tryJumpDino(performance.now());
    }
  });

  $("dinoJumpBtn").addEventListener("click", () => {
    startDinoIfNeeded();
    tryJumpDino(performance.now());
  });

  $("dinoRestartBtn").addEventListener("click", () => {
    resetDinoState();
    showEl($("step2Result"), false);
    showEl($("dinoRestartBtn"), true);
    showEl($("dinoJumpBtn"), true);
    localStorage.removeItem(STORAGE_KEYS.step2Done);
    localStorage.removeItem(STORAGE_KEYS.step2Digit);
  });

  $("dinoHowBtn").addEventListener("click", () => {
    alert("Salta con Espacio/Arriba o el botón. Objetivo: 5000 puntos (100 por obstáculo esquivado).");
  });

  resetDinoState();
}

function chooseRandomDistinct(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const memoryState = {
  phase: 1,
  running: false,
  cards: [],
  flipped: [],
  matchedPairs: new Set(),
  busy: false,
  hintUsed: false,
  selectedImageFiles: [],
  rafTimeout: null,
};

function memorySetPhase(phase) {
  memoryState.phase = phase;
  memoryState.running = true;
  memoryState.cards = [];
  memoryState.flipped = [];
  memoryState.matchedPairs = new Set();
  memoryState.busy = false;
  memoryState.hintUsed = false;

  if (memoryState.rafTimeout) window.clearTimeout(memoryState.rafTimeout);

  const targetPairs = MEM_PHASES[phase - 1].pairs;
  const imagesCount = MEMORY_IMAGES.length;
  const all = [...MEMORY_IMAGES];
  if (phase === 3) {
    memoryState.selectedImageFiles = [...MEMORY_IMAGES];
  } else if (phase === 1) {
    memoryState.selectedImageFiles = chooseRandomDistinct(all, targetPairs);
  } else if (phase === 2) {
    memoryState.selectedImageFiles = chooseRandomDistinct(all, targetPairs);
  } else {
    memoryState.selectedImageFiles = chooseRandomDistinct(all, Math.min(targetPairs, imagesCount));
  }

  memoryRenderGrid();
  $("memorySubtitle").textContent = `${MEM_PHASES[phase - 1].label}. Encuentra todas las parejas.`;
  $("memoryStatus").textContent = "";
  $("memoryProgress").textContent = "";
}

function memoryRenderGrid() {
  const grid = $("memoryGrid");
  grid.innerHTML = "";

  const pairCount = MEM_PHASES[memoryState.phase - 1].pairs;
  const pairImages = memoryState.selectedImageFiles.slice(0, pairCount);

  const pairs = pairImages.map((file, pairId) => {
    return { pairId, file, imgUrl: `./fotos/${file}` };
  });

  const cards = [];
  for (const p of pairs) {
    cards.push({ cardId: `${p.pairId}-a`, pairId: p.pairId, imgUrl: p.imgUrl });
    cards.push({ cardId: `${p.pairId}-b`, pairId: p.pairId, imgUrl: p.imgUrl });
  }

  memoryState.cards = shuffleArray(cards);

  for (let i = 0; i < memoryState.cards.length; i++) {
    const c = memoryState.cards[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mem-card";
    btn.dataset.pairId = String(c.pairId);
    btn.dataset.cardIndex = String(i);

    const back = document.createElement("div");
    back.className = "mem-back";
    back.textContent = "?";

    const img = document.createElement("img");
    img.className = "mem-img is-hidden";
    img.src = c.imgUrl;
    img.alt = "Carta";

    btn.appendChild(back);
    btn.appendChild(img);

    btn.addEventListener("click", () => memoryOnCardClicked(i));
    grid.appendChild(btn);
  }

  updateMemoryProgressText();
}

function updateMemoryProgressText() {
  const phase = memoryState.phase;
  const targetPairs = MEM_PHASES[phase - 1].pairs;
  const matched = memoryState.matchedPairs.size;
  $("memoryProgress").textContent = `Pares encontrados: ${matched}/${targetPairs}`;
}

function memorySetCardFlipped(cardIndex, isFlipped) {
  const grid = $("memoryGrid");
  const btn = grid.querySelector(`.mem-card[data-card-index="${cardIndex}"]`);
  // Not found by selector because dataset is cardIndex with name mismatch; ensure via data attributes below.
}

function memoryOnCardClicked(cardIndex) {
  if (memoryState.busy) return;
  if (!memoryState.running) return;
  const grid = $("memoryGrid");
  const btn = grid.querySelector(`.mem-card[data-card-index="${cardIndex}"]`);

  if (!btn) return;

  const pairId = Number(btn.dataset.pairId);
  const isMatched = memoryState.matchedPairs.has(pairId);
  if (isMatched) return;

  if (btn.classList.contains("is-flipped")) return;
  if (memoryState.flipped.length >= 2) return;

  // Flip
  btn.classList.add("is-flipped");
  const img = btn.querySelector("img.mem-img");
  if (img) img.classList.remove("is-hidden");
  memoryState.flipped.push(cardIndex);

  if (memoryState.flipped.length === 2) {
    memoryState.busy = true;
    const [aIdx, bIdx] = memoryState.flipped;
    const a = memoryState.cards[aIdx];
    const b = memoryState.cards[bIdx];

    const aBtn = grid.querySelector(`.mem-card[data-card-index="${aIdx}"]`);
    const bBtn = grid.querySelector(`.mem-card[data-card-index="${bIdx}"]`);

    const match = a.pairId === b.pairId;
    if (match) {
      memoryState.matchedPairs.add(a.pairId);
      memoryState.flipped = [];
      memoryState.busy = false;
      updateMemoryProgressText();

      const totalPairs = MEM_PHASES[memoryState.phase - 1].pairs;
      if (memoryState.matchedPairs.size === totalPairs) {
        memoryPhaseCompleted();
      } else {
        $("memoryStatus").textContent = "¡Bien! Sigue así.";
      }
    } else {
      $("memoryStatus").textContent = "No es pareja. Intenta de nuevo...";
      const revertDelay = 900;
      memoryState.rafTimeout = window.setTimeout(() => {
        if (aBtn) {
          aBtn.classList.remove("is-flipped");
          const imgA = aBtn.querySelector("img.mem-img");
          if (imgA) imgA.classList.add("is-hidden");
        }
        if (bBtn) {
          bBtn.classList.remove("is-flipped");
          const imgB = bBtn.querySelector("img.mem-img");
          if (imgB) imgB.classList.add("is-hidden");
        }
        memoryState.flipped = [];
        memoryState.busy = false;
        updateMemoryProgressText();
      }, revertDelay);
    }
  }
}

function memoryPhaseCompleted() {
  memoryState.running = false;
  $("memoryStatus").textContent = `¡Fase ${memoryState.phase} superada!`;

  if (memoryState.phase < 3) {
    $("memoryProgress").textContent = "";
    const next = memoryState.phase + 1;
    memoryState.rafTimeout = window.setTimeout(() => {
      memorySetPhase(next);
    }, 900);
    return;
  }

  // Completed phase 3
  localStorage.setItem(STORAGE_KEYS.step3Done, "1");
  localStorage.setItem(STORAGE_KEYS.step3Digit, DIGIT_B);

  //$("digitB").textContent = DIGIT_B;
  $("memoryClue").textContent = CLUE_FOR_KEY_LOCATION;
  showEl($("step3Result"), true);
}

function memoryTryHint() {
  if (memoryState.hintUsed) return;
  if (memoryState.busy) return;
  if (memoryState.running !== true) return;

  if (memoryState.flipped.length !== 0) {
    $("memoryStatus").textContent = "Completa o espera a que no haya cartas abiertas para usar la pista.";
    return;
  }

  const pairCount = MEM_PHASES[memoryState.phase - 1].pairs;
  // Find first unmatched pair id.
  let chosenPair = null;
  for (let pid = 0; pid < pairCount; pid++) {
    if (!memoryState.matchedPairs.has(pid)) {
      chosenPair = pid;
      break;
    }
  }
  if (chosenPair === null) return;

  // Flip both cards of the chosen pair temporarily.
  const indices = [];
  for (let i = 0; i < memoryState.cards.length; i++) {
    if (memoryState.cards[i].pairId === chosenPair) indices.push(i);
  }
  if (indices.length < 2) return;

  memoryState.hintUsed = true;
  memoryState.busy = true;
  $("memoryStatus").textContent = "Pista: estas dos cartas son pareja.";

  const grid = $("memoryGrid");
  const [aIdx, bIdx] = indices;
  const aBtn = grid.querySelector(`.mem-card[data-card-index="${aIdx}"]`);
  const bBtn = grid.querySelector(`.mem-card[data-card-index="${bIdx}"]`);

  if (aBtn) {
    aBtn.classList.add("is-flipped");
    const imgA = aBtn.querySelector("img.mem-img");
    if (imgA) imgA.classList.remove("is-hidden");
  }
  if (bBtn) {
    bBtn.classList.add("is-flipped");
    const imgB = bBtn.querySelector("img.mem-img");
    if (imgB) imgB.classList.remove("is-hidden");
  }

  window.setTimeout(() => {
    if (aBtn) {
      aBtn.classList.remove("is-flipped");
      const imgA = aBtn.querySelector("img.mem-img");
      if (imgA) imgA.classList.add("is-hidden");
    }
    if (bBtn) {
      bBtn.classList.remove("is-flipped");
      const imgB = bBtn.querySelector("img.mem-img");
      if (imgB) imgB.classList.add("is-hidden");
    }
    memoryState.busy = false;
    memoryState.flipped = [];
    updateMemoryProgressText();
  }, 900);
}

function initMemory() {
  $("memoryRestartBtn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEYS.step3Done);
    localStorage.removeItem(STORAGE_KEYS.step3Digit);
    showEl($("step3Result"), false);
    memoryState.running = true;
    memorySetPhase(1);
  });

  $("memoryHelpBtn").addEventListener("click", () => memoryTryHint());
  memorySetPhase(1);
}

function zipCoordToPathIndex(x, y, size) {
  // Serpentine rows: even rows go left->right, odd rows go right->left.
  if (y % 2 === 0) return y * size + x;
  return y * size + (size - 1 - x);
}

function zipPathIndexToCoord(pathIndex, size) {
  const y = Math.floor(pathIndex / size);
  const rowIndex = pathIndex % size;
  const x = y % 2 === 0 ? rowIndex : size - 1 - rowIndex;
  return { x, y };
}

function zipFailure(msg) {
  zipState.visited.clear();
  zipState.currentIndex = 0;
  zipState.numberExpected = 1;
  zipState.usedHint1 = false;
  zipState.usedHint2 = false;
  zipState.defaultExpected = true;
  $("zipMessage").textContent = msg;
  $("zipCounter").textContent = "";
  zipRenderHintsAndExpected();

  // Clear result styling
  for (const cellEl of zipState.cellEls) {
    cellEl.classList.remove("visited", "correct", "expected", "hinted");
    if (cellEl.disabled) cellEl.disabled = false;
  }
  zipRenderNumbers();
}

function zipRenderNumbers() {
  for (const { el, pathIndex } of zipState.cellByPathIndex) {
    const num = zipState.numberByPathIndex[pathIndex];
    el.textContent = num ? String(num) : "";
  }
}

const zipState = {
  size: 10,
  pathLength: 100,
  solutionPath: [],
  numberByPathIndex: {},
  pathIndexByNumber: {},
  currentIndex: 0,
  numberExpected: 1,
  visited: new Set(),
  cellEls: [],
  cellByPathIndex: [],
  usedHint1: false,
  usedHint2: false,
};

let finalValidateBound = false;

function bindFinalValidate() {
  if (finalValidateBound) return;
  finalValidateBound = true;
  $("finalValidateBtn").addEventListener("click", () => {
    const raw = $("finalCodeInput").value.trim();
    if (raw === FINAL_LOCK_CODE) {
      $("finalValidateResult").textContent = "Código correcto. ¡Felicidades!";
    } else {
      $("finalValidateResult").textContent = "Código incorrecto. Vuelve a intentarlo.";
    }
  });
}

/* ------------------------ Simon Dice (step 4) ------------------------ */

const SIMON_MAX_ROUNDS = 10;
const simonBtnEls = [
  $("simonBtn0"),
  $("simonBtn1"),
  $("simonBtn2"),
  $("simonBtn3"),
];

const simonState = {
  sequence: [],
  round: 0,
  userIndex: 0,
  playing: false,
  listenersBound: false,
};

function setSimonButtonsEnabled(isEnabled) {
  for (const btn of simonBtnEls) {
    if (!btn) continue;
    btn.disabled = !isEnabled;
  }
}

function simonLight(valueIndex, isOn) {
  const btn = simonBtnEls[valueIndex];
  if (!btn) return;
  btn.classList.toggle("is-lit", !!isOn);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simonPlaySequence() {
  simonState.playing = true;
  setSimonButtonsEnabled(false);

  $("simonMessage").textContent = "Mira la secuencia...";
  await sleep(350);

  for (let i = 0; i < simonState.sequence.length; i++) {
    const value = simonState.sequence[i];
    simonLight(value, true);
    await sleep(420);
    simonLight(value, false);
    await sleep(120);
  }

  simonState.playing = false;
  simonState.userIndex = 0;
  $("simonMessage").textContent = "Tu turno.";
  setSimonButtonsEnabled(true);
}

function simonStartNewGame() {
  simonState.sequence = [];
  simonState.round = 0;
  simonState.userIndex = 0;
  simonState.playing = false;

  $("simonRoundText").textContent = `Ronda 0 de ${SIMON_MAX_ROUNDS}`;
  $("simonMessage").textContent = "Pulsa Reiniciar para empezar.";

  setSimonButtonsEnabled(true);
}

function simonNextRound() {
  if (simonState.round >= SIMON_MAX_ROUNDS) return;

  const nextValue = Math.floor(Math.random() * 4); // 0..3
  simonState.sequence.push(nextValue);
  simonState.round += 1;
  $("simonRoundText").textContent = `Ronda ${simonState.round} de ${SIMON_MAX_ROUNDS}`;

  simonPlaySequence();
}

function simonHandleCorrectStep() {
  simonState.userIndex += 1;

  if (simonState.userIndex >= simonState.sequence.length) {
    if (simonState.round >= SIMON_MAX_ROUNDS) {
      winSimon();
      return;
    }
    simonNextRound();
  }
}

function simonHandleWrongStep() {
  simonState.playing = true;
  setSimonButtonsEnabled(false);
  $("simonMessage").textContent = "Fallaste. Reiniciando...";

  window.setTimeout(() => {
    simonStartNewGame();
    simonNextRound(); // empieza por ronda 1 inmediatamente
  }, 900);
}

function winSimon() {
  simonState.playing = false;
  setSimonButtonsEnabled(false);

  $("simonMessage").textContent = "¡Correcto! Prueba final completada.";
  localStorage.setItem(STORAGE_KEYS.step4Done, "1");
  localStorage.setItem(STORAGE_KEYS.step4Digit, DIGIT_C);

  //$("digitC").textContent = DIGIT_C;
  //$("simonFinalText").textContent = SIMON_FINAL_TEXT;
  showEl($("step4Result"), true);
  bindFinalValidate();
}

function initSimon() {
  if (!simonState.listenersBound) {
    for (let idx = 0; idx < simonBtnEls.length; idx++) {
      const btn = simonBtnEls[idx];
      if (!btn) continue;
      btn.addEventListener("click", () => {
        if (simonState.playing) return;
        if (simonState.userIndex >= simonState.sequence.length) return;

        simonLight(idx, true);
        window.setTimeout(() => simonLight(idx, false), 160);

        const expected = simonState.sequence[simonState.userIndex];
        if (idx === expected) {
          $("simonMessage").textContent = "Bien.";
          simonHandleCorrectStep();
        } else {
          simonHandleWrongStep();
        }
      });
    }

    $("simonRestartBtn").addEventListener("click", () => {
      simonStartNewGame();
      simonNextRound();
    });

    simonState.listenersBound = true;
  }

  // Si recargamos, reiniciamos para que el usuario empiece desde el principio.
  simonStartNewGame();
  simonNextRound();
}

function zipSetup() {
  zipState.size = 10;
  zipState.pathLength = 100;
  zipState.solutionPath = [];
  zipState.numberByPathIndex = {};
  zipState.pathIndexByNumber = {};
  zipState.currentIndex = 0;
  zipState.numberExpected = 1;
  zipState.visited = new Set();
  zipState.usedHint1 = false;
  zipState.usedHint2 = false;

  // Build solution path (serpentine through all cells)
  for (let y = 0; y < zipState.size; y++) {
    for (let x = 0; x < zipState.size; x++) {
      // Coordinate -> path index
      const pathIndex = zipCoordToPathIndex(x, y, zipState.size);
      zipState.solutionPath[pathIndex] = { x, y };
    }
  }

  // Place 16 numbers along the path (number 1 at start, number 16 at end)
  const numberIndices = [0, 6, 12, 18, 24, 30, 36, 42, 50, 56, 62, 68, 74, 80, 86, 99];
  for (let i = 0; i < numberIndices.length; i++) {
    const pathIndex = numberIndices[i];
    const num = i + 1;
    zipState.numberByPathIndex[pathIndex] = num;
    zipState.pathIndexByNumber[num] = pathIndex;
  }
}

function zipRenderGrid() {
  const grid = $("zipGrid");
  grid.innerHTML = "";
  zipState.cellEls = [];
  zipState.cellByPathIndex = [];

  // Render in (y,x) order; store the element by pathIndex so we can highlight by expected step.
  for (let y = 0; y < zipState.size; y++) {
    for (let x = 0; x < zipState.size; x++) {
      const pathIndex = zipCoordToPathIndex(x, y, zipState.size);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zip-cell";
      btn.dataset.x = String(x);
      btn.dataset.y = String(y);
      btn.dataset.pathIndex = String(pathIndex);

      const num = zipState.numberByPathIndex[pathIndex];
      btn.textContent = num ? String(num) : "";

      btn.addEventListener("click", () => zipOnCellClicked(x, y, pathIndex));
      grid.appendChild(btn);

      zipState.cellEls.push(btn);
      zipState.cellByPathIndex.push({ el: btn, pathIndex });
    }
  }
}

function zipRenderHintsAndExpected() {
  // Más difícil: no marcamos la casilla exacta del siguiente paso.
  // Solo resaltamos la casilla donde está el "siguiente número esperado".
  for (const { el } of zipState.cellByPathIndex) el.classList.remove("expected");

  const nextNumberPathIndex = zipState.pathIndexByNumber[zipState.numberExpected];
  const found = zipState.cellByPathIndex.find(
    (c) => c.pathIndex === nextNumberPathIndex
  );
  if (found && found.el) found.el.classList.add("expected");
}

function zipHighlightPathRange(startPathIndex, endPathIndex) {
  const s = Math.max(0, startPathIndex);
  const e = Math.min(zipState.pathLength - 1, endPathIndex);
  for (const { el, pathIndex } of zipState.cellByPathIndex) {
    el.classList.toggle("hinted", pathIndex >= s && pathIndex <= e);
  }
}

function zipOnHint1() {
  if (zipState.usedHint1) return;
  zipState.usedHint1 = true;
  $("zipMessage").textContent = "Pista 1: mira el tramo inicial del recorrido.";
  zipHighlightPathRange(0, 35);
}

function zipOnHint2() {
  if (zipState.usedHint2) return;
  zipState.usedHint2 = true;

  const indices = [
    0, 6, 12, 18, 24, 30, 36, 42, 50, 56, 62, 68, 74, 80, 86, 99,
  ];
  // Number 8 to 12 => indices[7]..indices[11]
  const start = indices[7];
  const end = indices[11];
  $("zipMessage").textContent = "Pista 2: este es el tramo intermedio por el que pasas.";
  zipHighlightPathRange(start, end);
}

function zipMarkCellVisited(pathIndex) {
  const found = zipState.cellByPathIndex.find((c) => c.pathIndex === pathIndex);
  const cellEl = found ? found.el : null;
  if (cellEl) {
    cellEl.classList.add("visited", "correct");
    cellEl.disabled = true;
  }
}

function zipOnCellClicked(x, y, pathIndex) {
  const expectedPathIndex = zipState.currentIndex;
  if (pathIndex !== expectedPathIndex) {
    zipFailure("Ruta incorrecta. Reiniciamos para que lo intentes mejor.");
    return;
  }

  // Validate not visited
  const coordKey = `${x},${y}`;
  if (zipState.visited.has(coordKey)) {
    zipFailure("Has repetido una casilla. Reiniciamos.");
    return;
  }

  zipState.visited.add(coordKey);
  zipMarkCellVisited(pathIndex);

  const numHere = zipState.numberByPathIndex[pathIndex];
  if (numHere) {
    if (numHere !== zipState.numberExpected) {
      zipFailure(`El número va desordenado. Se esperaba el ${zipState.numberExpected}.`);
      return;
    }
    zipState.numberExpected += 1;
    $("zipMessage").textContent = `Perfecto. Has llegado al número ${numHere}.`;
  } else {
    $("zipMessage").textContent = "Bien. Sigues el recorrido.";
  }

  zipState.currentIndex += 1;

  $("zipCounter").textContent = `Casillas completadas: ${zipState.currentIndex}/100`;

  if (zipState.currentIndex >= zipState.pathLength) {
    if (zipState.numberExpected === 17) {
      winZip();
      return;
    }
    zipFailure("No se ha completado el orden de números. Reiniciamos.");
    return;
  }

  // Update expected highlight
  zipRenderHintsAndExpected();
}

function winZip() {
  $("zipMessage").textContent = "¡Enhorabuena! Has completado el recorrido.";
  localStorage.setItem(STORAGE_KEYS.step4Done, "1");
  localStorage.setItem(STORAGE_KEYS.step4Digit, DIGIT_C);

  //$("digitC").textContent = DIGIT_C;
  $("zipFinalText").textContent = ZIP_FINAL_TEXT;
  showEl($("step4Result"), true);
}

function initZip() {
  $("zipHint1Btn").addEventListener("click", () => zipOnHint1());
  $("zipHint2Btn").addEventListener("click", () => zipOnHint2());
  $("zipRestartBtn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEYS.step4Done);
    localStorage.removeItem(STORAGE_KEYS.step4Digit);
    showEl($("step4Result"), false);
    initZipGame();
  });

  bindFinalValidate();

  initZipGame();
}

function initZipGame() {
  zipSetup();
  zipRenderGrid();
  $("zipCounter").textContent = "Casillas completadas: 0/100";
  $("zipMessage").textContent = "Empieza en la casilla con el 1 y sigue el recorrido pasando por todas las casillas.";
  $("finalValidateResult").textContent = "";
  zipRenderHintsAndExpected();
}

function initStepRouting(step) {
  // Step 1
  if (step === 1) {
    showEl($("step2Result"), false);
    showEl($("step3Result"), false);
    showEl($("step4Result"), false);
    showEl($("step2"), true);
    showEl($("step3"), true);
    showEl($("step4"), true);
    // no-op (we rely on setStep outside)
  }
}

function boot() {
  const step = getStepFromUrl();
  setStep(step);

  // Bind step1 start button
  $("toStep2Btn").addEventListener("click", () => {
    localStorage.setItem("escape_step1_started", "1");
    // Keep the same tab but navigate to step 2.
    window.location.search = "?step=2";
  });

  // Dino step
  if (step === 2) {
    const done = localStorage.getItem(STORAGE_KEYS.step2Done) === "1";
    showEl($("step2Result"), done);
    showEl($("dinoJumpBtn"), !done);
    showEl($("dinoRestartBtn"), !done);

    if (done) {
      const storedDigitA = localStorage.getItem(STORAGE_KEYS.step2Digit);
      //$("digitA").textContent = storedDigitA !== null ? storedDigitA : DIGIT_A;
      $("dinoClue").textContent = CLUE_FOR_GIFT_LOCATION;
      // prevent accidental running
      $("dinoStatus").textContent = "Prueba 1 ya superada.";
    } else {
      $("dinoStatus").textContent = "";
      initDino();
    }
  }

  // Memory step
  if (step === 3) {
    const done = localStorage.getItem(STORAGE_KEYS.step3Done) === "1";
    const step2Done = localStorage.getItem(STORAGE_KEYS.step2Done) === "1";

    if (!step2Done) {
      $("memorySubtitle").textContent = "Primero completa la prueba 1 (Dinosaurio).";
      $("memoryStatus").textContent =
        "Necesitas la pista de la prueba 1 antes de empezar la memoria.";
      showEl($("step3Result"), false);
      showEl($("step3"), true);
    } else if (done) {
      const storedDigitB = localStorage.getItem(STORAGE_KEYS.step3Digit);
      //$("digitB").textContent = storedDigitB !== null ? storedDigitB : DIGIT_B;
      $("memoryClue").textContent = CLUE_FOR_KEY_LOCATION;
      showEl($("step3Result"), true);
    } else {
      initMemory();
      $("memoryStatus").textContent = "";
      showEl($("step3Result"), false);
    }
  }

  if (step === 4) {
    const done = localStorage.getItem(STORAGE_KEYS.step4Done) === "1";
    const step3Done = localStorage.getItem(STORAGE_KEYS.step3Done) === "1";

    if (!step3Done) {
      $("simonSubtitle").textContent = "Primero completa la prueba 2 (Memoria).";
      $("simonMessage").textContent =
        "Necesitas el dígito de la memoria antes de jugar a la prueba final.";
      showEl($("step4Result"), false);
      $("simonRoundText").textContent = "";
      setSimonButtonsEnabled(false);
      return;
    }

    if (done) {
      const storedDigitC = localStorage.getItem(STORAGE_KEYS.step4Digit);
      //$("digitC").textContent = storedDigitC !== null ? storedDigitC : DIGIT_C;
      //$("simonFinalText").textContent = SIMON_FINAL_TEXT;
      showEl($("step4Result"), true);
      showEl($("step4"), true);
      bindFinalValidate();
      $("simonSubtitle").textContent = "Prueba final completada.";
      setSimonButtonsEnabled(false);
    } else {
      showEl($("step4Result"), false);
      $("simonSubtitle").textContent = "Simon Dice: repite la secuencia.";
      setSimonButtonsEnabled(true);
      initSimon();
    }

  }

  // Step 3 defaults for UI strings
  if (step === 3) {
    $("memoryHelpBtn").disabled = false;
  }

  // Reset initial texts
  //$("step2Result").querySelector("#digitA").textContent = DIGIT_A;
}

boot();
