/* ============================================================
   ALCHEMIST.PY — LEVEL 13: THE STONE DOOR
   (Cave Entrance — Multiplication Table)
   JavaScript Game Logic
   ============================================================ */

// ============================================================
// CONFIGURATION
// ============================================================

// Random number for multiplication table (2–12)
var TABLE_NUM = Math.floor(Math.random() * 11) + 2;
var TABLE_RANGE = 10;

// Build expected output
var EXPECTED_LINES = [];
for (var t = 1; t <= TABLE_RANGE; t++) {
    EXPECTED_LINES.push(TABLE_NUM + " x " + t + " = " + (TABLE_NUM * t));
}
var EXPECTED_OUTPUT = EXPECTED_LINES.join('\n');

// Dialogue lines — cat discovers the stone door
var DIALOGUE_LINES = [
    "This must be the cave the wizard told me about!",
    "I can almost SMELL the gold coins from here...",
    "Wait — there's a massive stone door blocking the entrance!",
    "The runes on the door are glowing... they want something!",
    "It says: SPEAK THE TABLE OF " + TABLE_NUM + "!",
    "A multiplication table of " + TABLE_NUM + "! From 1 to " + TABLE_RANGE + "!",
    "Alright, I'll write a Python loop to generate the full table.",
    "Each line must be: " + TABLE_NUM + " x 1 = " + TABLE_NUM + ", " + TABLE_NUM + " x 2 = " + (TABLE_NUM * 2) + " ...",
    "Click on me to open the unlocking spell!"
];

// ============================================================
// STATE
// ============================================================
var dialogueIndex = 0;
var typingTimeout = null;
var isTyping = false;
var pyodideReady = false;
var particles = [];
var puzzleSolved = false;
var attemptsCount = 0;

// ============================================================
// DOM REFS
// ============================================================
var roomBg = document.getElementById('room-bg');
var doorHud = document.getElementById('door-hud');
var doorNumber = document.getElementById('door-number');
var doorStatus = document.getElementById('door-status');
var catSprite = document.getElementById('the-cat-lvl13');
var dialogueBox = document.getElementById('dialogue-box');
var typewriterText = document.getElementById('typewriter-text-lvl13');
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

    // Set HUD
    doorNumber.textContent = '×' + TABLE_NUM;

    // Show cat & start dialogue
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
        completeLevelCh2(13);
        showLevelLoadingCh2('lvl14.html', 'Loading Level 14...');
    });

    // Click dialogue to advance
    dialogueBox.addEventListener('click', advanceDialogue);

    // Start particle animation loop
    animateParticles();

    // Add cave glow
    roomBg.classList.add('cave-glow');
});



// ============================================================
// DIALOGUE
// ============================================================
function showDialogue(index) {
    if (index >= DIALOGUE_LINES.length) {
        doorHud.classList.add('visible');
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
        doorHud.classList.add('visible');
        dialogueBox.style.display = 'none';
    }
}

// ============================================================
// GRIMOIRE
// ============================================================
function openGrimoire() {
    if (puzzleSolved) return;

    spellTaskText.textContent = 'Print the multiplication table of ' + TABLE_NUM + ' from 1 to ' + TABLE_RANGE + '. Format: "' + TABLE_NUM + ' x 1 = ' + TABLE_NUM + '"';
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
    outputText.textContent = 'The runes are glowing...';
    outputText.className = '';

    evaluatePython(code).then(function (result) {
        if (result.indexOf('Error:') === 0) {
            if (result.indexOf('input') !== -1) {
                outputText.textContent = "❌ input() doesn't work here!\n\n💡 Use the number directly:\nfor i in range(1, 11):\n    print(f\"" + TABLE_NUM + " x {i} = {" + TABLE_NUM + " * i}\")";
            } else {
                outputText.textContent = result;
            }
            outputText.className = 'error';
            shakeGrimoire();
            return;
        }

        var trimmed = result.trim();

        // Normalize comparison: strip extra spaces
        var userLines = trimmed.split('\n');
        var normalizedUser = [];
        for (var i = 0; i < userLines.length; i++) {
            var l = userLines[i].trim();
            if (l.length > 0) normalizedUser.push(l);
        }

        var normalizedExpected = [];
        for (var j = 0; j < EXPECTED_LINES.length; j++) {
            normalizedExpected.push(EXPECTED_LINES[j].trim());
        }

        // Check match
        var allCorrect = normalizedUser.length === normalizedExpected.length;
        if (allCorrect) {
            for (var k = 0; k < normalizedExpected.length; k++) {
                if (normalizedUser[k] !== normalizedExpected[k]) {
                    allCorrect = false;
                    break;
                }
            }
        }

        if (allCorrect) {
            outputText.textContent = 'Output:\n' + trimmed + '\n\n✨ CORRECT! The runes glow bright!';
            outputText.className = 'success';
            puzzleSolved = true;

            setTimeout(function () {
                closeGrimoire();
                triggerVictory();
            }, 1200);
        } else {
            // Show what was expected
            var hint = 'Expected format:\n';
            hint += EXPECTED_LINES[0] + '\n';
            hint += EXPECTED_LINES[1] + '\n';
            hint += '...\n';
            hint += EXPECTED_LINES[EXPECTED_LINES.length - 1];
            outputText.textContent = 'Output:\n' + trimmed + '\n\n❌ Not quite!\n' + hint + '\n\n💡 Use a for loop with range(1, 11)';
            outputText.className = 'error';
            shakeGrimoire();
        }
    });
}

// ============================================================
// VICTORY SEQUENCE
// ============================================================
function triggerVictory() {
    // Update HUD
    doorStatus.textContent = 'UNLOCKED';
    doorStatus.classList.add('unlocked');
    catSprite.style.filter = 'brightness(1)';

    emitParticles(60);

    // Show victory dialogue
    dialogueBox.style.display = 'block';
    typewriterText.innerHTML = '';
    isTyping = true;
    var msg = "YES! The stone door is rumbling open! I can see golden light inside the cave! 🪙✨";
    var ci = 0;
    (function t() {
        if (ci < msg.length) {
            typewriterText.innerHTML += msg.charAt(ci++);
            setTimeout(t, 25);
        } else {
            isTyping = false;
        }
    })();

    setTimeout(function () {
        dialogueBox.style.display = 'none';
        showSuccessScreen();
    }, 3500);
}

function showSuccessScreen() {
    successStats.innerHTML =
        'TABLE: ' + TABLE_NUM + ' × 1 through ' + TABLE_NUM + ' × ' + TABLE_RANGE + '<br>' +
        'ATTEMPTS: ' + attemptsCount + '<br>' +
        'STATUS: DOOR UNLOCKED! 🔓';
    successScreen.classList.add('show');
    emitParticles(80);
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
            x: Math.random() * particleCanvas.width,
            y: particleCanvas.height + 10,
            vx: (Math.random() - 0.5) * 3,
            vy: -(Math.random() * 4 + 2),
            life: 1,
            decay: Math.random() * 0.015 + 0.005,
            size: Math.random() * 4 + 1,
            color: ['217,119,6', '251,191,36', '245,158,11', '180,83,9', '255,215,0', '146,64,14'][Math.floor(Math.random() * 6)]
        });
    }
}

function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particles = particles.filter(function (p) { return p.life > 0; });

    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.life -= p.decay;

        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        particleCtx.fillStyle = 'rgba(' + p.color + ',' + p.life + ')';
        particleCtx.fill();

        // Glow
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        particleCtx.fillStyle = 'rgba(' + p.color + ',' + (p.life * 0.15) + ')';
        particleCtx.fill();
    }

    requestAnimationFrame(animateParticles);
}
