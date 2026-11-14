/* ============================================================
   ALCHEMIST.PY — LEVEL 2: THE BROKEN FLOOR
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Three random numbers that the user must sum to 100
var NUM_A = Math.floor(Math.random() * 40) + 10;  // 10–49
var NUM_B = Math.floor(Math.random() * 30) + 10;  // 10–39
var NUM_C = 100 - NUM_A - NUM_B;                   // ensures sum = 100

// Shuffle which order the numbers appear
var PLANK_NUMBERS = shuffleArray([NUM_A, NUM_B, NUM_C]);

var DIALOGUE_LINES = [
    "Finally inside the mansion... but what's this?!",
    "The floor is completely broken! There's a dark chasm below!",
    "I can see shattered stone and gaping holes everywhere...",
    "We need exactly 100 planks to repair this floor.",
    "I've found three stacks of planks: " + PLANK_NUMBERS[0] + ", " + PLANK_NUMBERS[1] + ", and " + PLANK_NUMBERS[2] + ".",
    "Write Python code to add these three numbers together.",
    "If they sum to exactly 100, the floor will be magically repaired!",
    "Click on me when you're ready to cast the summation spell..."
];

// Background images
var FLOOR_IMAGES = {
    broken: '../assets/Level 2/brokenfloor.png',
    fixed: '../assets/Level 2/notbrokenfloor.png'
};

// ============================================================
// STATE
// ============================================================
var dialogueIndex = 0;
var typingTimeout = null;
var isTyping = false;
var pyodideReady = false;
var particles = [];
var floorFixed = false;
var attemptsCount = 0;

// ============================================================
// DOM REFS
// ============================================================
var roomBg = document.getElementById('room-bg');
var plankHud = document.getElementById('plank-hud');
var plankCount = document.getElementById('plank-count');
var plankBarFill = document.getElementById('plank-bar-fill');
var catSprite = document.getElementById('the-cat-lvl2');
var dialogueBox = document.getElementById('dialogue-box');
var typewriterText = document.getElementById('typewriter-text-lvl2');
var grimoireOverlay = document.getElementById('grimoire-overlay');
var grimoireClose = document.getElementById('grimoire-close');
var spellTaskText = document.getElementById('spell-task-text');
var codeInput = document.getElementById('code-input');
var lineNumbers = document.getElementById('line-numbers');
var outputText = document.getElementById('output-text');
var btnCastSpell = document.getElementById('btn-cast-spell');
var btnClear = document.getElementById('btn-clear');
var successScreen = document.getElementById('success-screen');
var successStats = document.getElementById('success-stats');
var btnContinue = document.getElementById('btn-continue');
var particleCanvas = document.getElementById('spell-particles');
var particleCtx = particleCanvas.getContext('2d');

// ============================================================
// UTILITIES
// ============================================================
function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = a[i];
        a[i] = a[j];
        a[j] = temp;
    }
    return a;
}

// ============================================================
// INITIALIZE
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Init Pyodide
    initPython().then(function () {
        pyodideReady = true;
    }).catch(function (e) {
        console.error("Pyodide failed to load:", e);
    });

    // Show cat & start dialogue after short delay
    setTimeout(function () {
        catSprite.style.display = 'block';
        dialogueBox.style.display = 'block';
        showDialogue(0);
    }, 800);

    // Cat click → open grimoire
    catSprite.addEventListener('click', openGrimoire);

    // Grimoire controls
    grimoireClose.addEventListener('click', closeGrimoire);
    btnCastSpell.addEventListener('click', castSpell);
    btnClear.addEventListener('click', function () {
        codeInput.value = '';
        outputText.textContent = '';
        outputText.className = '';
        updateLineNumbers();
    });

    // Line numbers
    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', syncScroll);
    updateLineNumbers();

    // Continue button
    btnContinue.addEventListener('click', function () {
        showLevelLoading('lvl3.html', 'Loading Level 3...');
    });

    // Click dialogue to advance
    dialogueBox.addEventListener('click', advanceDialogue);

    // Start particle animation loop
    animateParticles();

    // Add torch flicker to room background
    roomBg.classList.add('torch-flicker');
});

// ============================================================
// DIALOGUE
// ============================================================
function showDialogue(index) {
    if (index >= DIALOGUE_LINES.length) {
        plankHud.classList.add('visible');
        return;
    }

    dialogueIndex = index;
    isTyping = true;
    typewriterText.innerHTML = '';

    var message = DIALOGUE_LINES[index];
    var characterIndex = 0;

    (function type() {
        if (characterIndex < message.length) {
            typewriterText.innerHTML += message.charAt(characterIndex);
            characterIndex++;
            typingTimeout = setTimeout(type, 35);
        } else {
            isTyping = false;
            addDialoguePrompt();
        }
    })();
}

function addDialoguePrompt() {
    var prompt = document.createElement('div');
    prompt.className = 'click-prompt';
    prompt.textContent = '▼ CLICK TO CONTINUE ▼';
    typewriterText.appendChild(prompt);
}

function advanceDialogue() {
    if (isTyping) {
        clearTimeout(typingTimeout);
        isTyping = false;
        typewriterText.textContent = DIALOGUE_LINES[dialogueIndex];
        addDialoguePrompt();
        return;
    }

    dialogueIndex++;
    if (dialogueIndex < DIALOGUE_LINES.length) {
        showDialogue(dialogueIndex);
    } else {
        plankHud.classList.add('visible');
        dialogueBox.style.display = 'none';
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (floorFixed) return;

    spellTaskText.textContent = 'Add the three plank stacks: ' + PLANK_NUMBERS[0] + ' + ' + PLANK_NUMBERS[1] + ' + ' + PLANK_NUMBERS[2] + '. Print the total.';
    codeInput.value = '';
    outputText.textContent = '';
    outputText.className = '';
    updateLineNumbers();
    grimoireOverlay.classList.add('open');
    setTimeout(function () {
        codeInput.focus();
    }, 250);
}

function closeGrimoire() {
    grimoireOverlay.classList.remove('open');
}

function castSpell() {
    if (!pyodideReady) {
        outputText.textContent = 'Python is still loading...';
        outputText.className = 'error';
        return;
    }

    var code = codeInput.value.trim();
    if (!code) {
        outputText.textContent = 'Write some Python first.';
        outputText.className = 'error';
        return;
    }

    attemptsCount++;
    outputText.textContent = 'Counting planks...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            outputText.textContent = result;
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        var total = Number(result.trim());
        if (total === 100) {
            outputText.textContent = 'Correct! The floor is repairing...';
            outputText.className = 'success';
            floorFixed = true;
            setTimeout(function () {
                closeGrimoire();
                repairFloor();
            }, 900);
        } else {
            outputText.textContent = 'Output was "' + result + '". The floor needs exactly 100 planks.';
            outputText.className = 'error';
            shakeGrimoire();
        }
    });
}

function repairFloor() {
    roomBg.style.backgroundImage = "url('" + FLOOR_IMAGES.fixed + "')";
    plankCount.textContent = '100 / 100';
    plankBarFill.style.width = '100%';
    catSprite.style.filter = 'brightness(1)';
    emitParticles(35);

    setTimeout(function () {
        successStats.innerHTML =
            'Stacks used: ' + PLANK_NUMBERS.join(' + ') + '<br>' +
            'Attempts: ' + attemptsCount;
        successScreen.classList.add('show');
    }, 1100);
}

// ============================================================
// EDITOR UTILITIES
// ============================================================
function updateLineNumbers() {
    var lines = codeInput.value.split('\n').length;
    var count = Math.max(lines, 8);
    var numbers = '';
    for (var i = 1; i <= count; i++) {
        numbers += i + '\n';
    }
    lineNumbers.textContent = numbers;
}

function syncScroll() {
    lineNumbers.scrollTop = codeInput.scrollTop;
}

// ============================================================
// VISUAL EFFECTS
// ============================================================
function resizeCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}

function shakeGrimoire() {
    var container = document.getElementById('grimoire-container');
    container.classList.remove('shake');
    void container.offsetWidth;
    container.classList.add('shake');
}

function emitParticles(count) {
    for (var i = 0; i < count; i++) {
        particles.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 9,
            vy: (Math.random() - 0.5) * 9,
            life: 60,
            size: Math.random() * 4 + 2
        });
    }
}

function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particles = particles.filter(function (particle) {
        return particle.life > 0;
    });

    for (var i = 0; i < particles.length; i++) {
        var particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.05;
        particle.life--;

        particleCtx.globalAlpha = particle.life / 60;
        particleCtx.fillStyle = '#f4c27a';
        particleCtx.beginPath();
        particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        particleCtx.fill();
    }

    particleCtx.globalAlpha = 1;
    requestAnimationFrame(animateParticles);
}
